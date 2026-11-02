import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG, getPublicConfig } from './config.ts';
import { ensureBatchDir, getBatchDir, getFilePath, checkStorageWritable } from './storage.ts';
import { validateAvifFile } from './validator.ts';
import { convertAvifToJpg } from './converters/avifToJpg.ts';
import { batchStore, type BatchRecord } from './batchStore.ts';
import { createZipArchive, formatZipFilename } from './archive.ts';
import { generateSampleAvif } from './sampleAvif.ts';
import { generateBatchId, generateFileId, isValidBatchId, isValidFileId } from '../src/utils/id.ts';
import { sanitiseFilename, resolveBatchOutputNames } from '../src/utils/filename.ts';
import { validateConversionOptions } from '../src/utils/validation.ts';
import type { FileItem, ApiErrorResponse } from '../src/types/index.ts';

export const apiRouter = express.Router();

// Middleware: attach correlation X-Request-Id and ensure JSON parsing
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// JSON body parser (limited to 100kb as per SR-012)
apiRouter.use(express.json({ limit: '100kb' }));

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Array<Record<string, unknown>>
) {
  const reqId = (res.getHeader('X-Request-Id') as string) || crypto.randomUUID();
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      details,
      requestId: reqId,
    },
  };
  return res.status(status).json(payload);
}

// 1. GET /health
apiRouter.get('/health', (req: Request, res: Response) => {
  const isWritable = checkStorageWritable();
  if (!isWritable) {
    return res.status(503).json({
      status: 'unavailable',
      version: CONFIG.APP_VERSION,
      storage: 'unavailable',
      time: new Date().toISOString(),
    });
  }
  return res.status(200).json({
    status: 'ok',
    version: CONFIG.APP_VERSION,
    uptimeSeconds: Math.floor(process.uptime()),
    storage: 'writable',
    time: new Date().toISOString(),
  });
});

// 2. GET /config
apiRouter.get('/config', (_req: Request, res: Response) => {
  return res.status(200).json(getPublicConfig());
});

// 3. GET /sample (Generates a sample AVIF file for user instant testing)
apiRouter.get('/sample', async (_req: Request, res: Response) => {
  try {
    const buffer = await generateSampleAvif(1000, 750, true);
    res.setHeader('Content-Type', 'image/avif');
    res.setHeader('Content-Disposition', 'attachment; filename="pixora-sample.avif"');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Failed to generate sample AVIF:', err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Could not generate sample image.');
  }
});

// Multer storage engine saving to batch directory
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      let bId = (req as unknown as { customBatchId?: string }).customBatchId;
      if (!bId) {
        bId = generateBatchId();
        (req as unknown as { customBatchId: string }).customBatchId = bId;
      }
      const dir = ensureBatchDir(bId);
      cb(null, dir);
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const fId = generateFileId();
    // Save temporarily as <fileId>.avif.upload (SR-005, SR-013)
    (file as unknown as { customFileId: string }).customFileId = fId;
    cb(null, `${fId}.avif.upload`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: CONFIG.MAX_FILES_PER_BATCH,
  },
}).array('files', CONFIG.MAX_FILES_PER_BATCH);

// 4. POST /batches
apiRouter.post('/batches', (req: Request, res: Response) => {
  uploadMiddleware(req, res, async (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            413,
            'FILE_TOO_LARGE',
            `A file exceeds the ${CONFIG.MAX_FILE_SIZE_MB} MB limit per file.`
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(
            res,
            422,
            'TOO_MANY_FILES',
            `You can convert up to ${CONFIG.MAX_FILES_PER_BATCH} images at a time.`
          );
        }
      }
      return sendError(res, 400, 'VALIDATION_ERROR', (err as Error).message);
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return sendError(res, 400, 'NO_FILES_PROVIDED', 'Choose at least one AVIF image to get started.');
    }

    const tool = (req.body.tool as string) || 'avif-to-jpg';
    if (tool !== 'avif-to-jpg') {
      return sendError(res, 400, 'UNSUPPORTED_TOOL', `Unsupported tool '${tool}'.`);
    }

    const batchId = (req as unknown as { customBatchId?: string }).customBatchId || generateBatchId();
    const batchDir = ensureBatchDir(batchId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CONFIG.RETENTION_MINUTES * 60 * 1000);

    const fileItems: FileItem[] = [];
    const storageFilenames = new Map<string, string>();

    // Validate uploaded file content
    const rawNames = files.map((f) => f.originalname);
    const resolvedOutputs = resolveBatchOutputNames(rawNames);

    let acceptedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = (file as unknown as { customFileId?: string }).customFileId || generateFileId();
      const originalPath = file.path;
      const targetAvifPath = path.join(batchDir, `${fileId}.avif`);
      const targetOutputName = resolvedOutputs[i];

      // Validate AVIF content & metadata
      const validation = await validateAvifFile(originalPath, file.originalname);

      if (validation.valid) {
        try {
          fs.renameSync(originalPath, targetAvifPath);
        } catch {
          fs.copyFileSync(originalPath, targetAvifPath);
          fs.unlinkSync(originalPath);
        }

        acceptedCount++;
        const item: FileItem = {
          fileId,
          originalName: file.originalname,
          status: 'uploaded',
          original: {
            sizeBytes: file.size,
            width: validation.width,
            height: validation.height,
            hasAlpha: validation.hasAlpha,
            bitDepth: validation.bitDepth,
          },
          output: null,
          warnings: [],
          error: null,
        };
        fileItems.push(item);
        storageFilenames.set(fileId, targetOutputName);
      } else {
        // Validation failed, remove file immediately
        try {
          if (fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath);
          }
        } catch {}

        rejectedCount++;
        fileItems.push({
          fileId,
          originalName: file.originalname,
          status: 'rejected',
          original: null,
          output: null,
          warnings: [],
          error: {
            code: validation.code,
            message: validation.message,
          },
        });
      }
    }

    if (acceptedCount === 0) {
      try {
        fs.rmSync(batchDir, { recursive: true, force: true });
      } catch {}
      return sendError(
        res,
        422,
        'NO_VALID_FILES',
        'None of the uploaded files were valid AVIF images.',
        fileItems.map((f) => ({ fileName: f.originalName, error: f.error?.message }))
      );
    }

    const batchRecord: BatchRecord = {
      batchId,
      tool,
      status: 'uploaded',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      pollIntervalMs: 1000,
      options: null,
      counts: {
        total: fileItems.length,
        accepted: acceptedCount,
        rejected: rejectedCount,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      files: fileItems,
      archive: null,
      storageFilenames,
    };

    batchStore.createBatch(batchRecord);

    res.setHeader('Location', `/api/v1/batches/${batchId}`);
    return res.status(201).json(batchRecord);
  });
});

// 5. POST /batches/:batchId/conversions
apiRouter.post('/batches/:batchId/conversions', async (req: Request, res: Response) => {
  const { batchId } = req.params;

  if (!isValidBatchId(batchId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid batch identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'These files were automatically deleted for your privacy.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found or session ended.');
  }

  if (batch.status !== 'uploaded') {
    return sendError(res, 409, 'BATCH_STATE_CONFLICT', `Conversion already initiated for batch ${batchId}.`);
  }

  // Validate conversion options
  const optValidation = validateConversionOptions(req.body.options || {});
  if (!optValidation.valid) {
    return sendError(res, 400, 'VALIDATION_ERROR', optValidation.errors.join('; '));
  }

  batch.options = optValidation.sanitized;
  batch.status = 'processing';

  // Mark accepted files as queued
  for (const f of batch.files) {
    if (f.status === 'uploaded') {
      f.status = 'queued';
    }
  }
  batchStore.updateBatchStatus(batchId);

  res.setHeader('Location', `/api/v1/batches/${batchId}`);
  // Return 202 Accepted immediately as per REST specification
  res.status(202).json(batch);

  // Asynchronous queue processing with bounded concurrency (default 2)
  processBatchQueue(batchId, optValidation.sanitized).catch((err) => {
    console.error(`Error in processBatchQueue for ${batchId}:`, err);
  });
});

async function processBatchQueue(
  batchId: string,
  options: { quality: number; background: string }
) {
  const batch = batchStore.getBatch(batchId);
  if (!batch) return;

  const acceptedFiles = batch.files.filter((f) => f.status === 'queued');
  const concurrency = CONFIG.CONVERSION_CONCURRENCY;

  // Worker pool processing queue in FIFO order
  let index = 0;

  async function worker() {
    while (index < acceptedFiles.length) {
      const file = acceptedFiles[index++];
      file.status = 'processing';
      file.startedAt = new Date().toISOString();
      batchStore.updateBatchStatus(batchId);

      const inputPath = getFilePath(batchId, `${file.fileId}.avif`);
      const outputFilename = `${file.fileId}.jpg`;
      const outputPath = getFilePath(batchId, outputFilename);
      const cleanOriginalName = sanitiseFilename(file.originalName);

      try {
        const result = await convertAvifToJpg(
          inputPath,
          outputPath,
          options,
          cleanOriginalName
        );

        if (result.success) {
          file.status = 'completed';
          file.finishedAt = new Date().toISOString();
          const targetDownloadName = batch?.storageFilenames?.get(file.fileId) || `${cleanOriginalName}.jpg`;
          file.output = {
            filename: targetDownloadName,
            mimeType: 'image/jpeg',
            sizeBytes: result.sizeBytes,
            width: result.width,
            height: result.height,
            previewUrl: `/api/v1/batches/${batchId}/files/${file.fileId}/preview`,
            downloadUrl: `/api/v1/batches/${batchId}/files/${file.fileId}/download`,
          };
        } else {
          file.status = 'failed';
          file.finishedAt = new Date().toISOString();
          file.error = result.error || {
            code: 'CONVERSION_FAILED',
            message: `We couldn’t convert “${cleanOriginalName}”. Your other images weren’t affected.`,
          };
        }
      } catch (err) {
        file.status = 'failed';
        file.finishedAt = new Date().toISOString();
        file.error = {
          code: 'CONVERSION_FAILED',
          message: `We couldn’t convert “${cleanOriginalName}”. Your other images weren’t affected.`,
        };
      }

      batchStore.updateBatchStatus(batchId);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, acceptedFiles.length) }, () => worker());
  await Promise.all(workers);
}

// 6. GET /batches/:batchId
apiRouter.get('/batches/:batchId', (req: Request, res: Response) => {
  const { batchId } = req.params;

  if (!isValidBatchId(batchId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid batch identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'These files were automatically deleted for your privacy.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found.');
  }

  return res.status(200).json(batch);
});

// 7. GET /batches/:batchId/files/:fileId/preview
apiRouter.get('/batches/:batchId/files/:fileId/preview', (req: Request, res: Response) => {
  const { batchId, fileId } = req.params;

  if (!isValidBatchId(batchId) || !isValidFileId(fileId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'Batch has expired.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found.');
  }

  const file = batch.files.find((f) => f.fileId === fileId);
  if (!file) {
    return sendError(res, 404, 'FILE_NOT_FOUND', 'File not found in batch.');
  }

  if (file.status !== 'completed') {
    return sendError(res, 409, 'FILE_NOT_READY', 'Converted file is not ready yet.');
  }

  const filePath = getFilePath(batchId, `${fileId}.jpg`);
  if (!fs.existsSync(filePath)) {
    return sendError(res, 404, 'FILE_NOT_FOUND', 'Output file missing on server.');
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  fs.createReadStream(filePath).pipe(res);
});

// 8. GET & HEAD /batches/:batchId/files/:fileId/download
const handleDownload = (req: Request, res: Response) => {
  const { batchId, fileId } = req.params;

  if (!isValidBatchId(batchId) || !isValidFileId(fileId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'Batch has expired.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found.');
  }

  const file = batch.files.find((f) => f.fileId === fileId);
  if (!file) {
    return sendError(res, 404, 'FILE_NOT_FOUND', 'File not found in batch.');
  }

  if (file.status !== 'completed' || !file.output) {
    return sendError(res, 409, 'FILE_NOT_READY', 'Converted file is not ready yet.');
  }

  const filePath = getFilePath(batchId, `${fileId}.jpg`);
  if (!fs.existsSync(filePath)) {
    return sendError(res, 404, 'FILE_NOT_FOUND', 'Output file missing on server.');
  }

  const stat = fs.statSync(filePath);
  const downloadName = file.output.filename || `${sanitiseFilename(file.originalName)}.jpg`;
  const asciiFallback = downloadName.replace(/[^\x20-\x7E]/g, '_');
  const encodedName = encodeURIComponent(downloadName);

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Length', stat.size);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  fs.createReadStream(filePath).pipe(res);
};

apiRouter.get('/batches/:batchId/files/:fileId/download', handleDownload);
apiRouter.head('/batches/:batchId/files/:fileId/download', handleDownload);

// 9. POST /batches/:batchId/archive
apiRouter.post('/batches/:batchId/archive', async (req: Request, res: Response) => {
  const { batchId } = req.params;

  if (!isValidBatchId(batchId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid batch identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'Batch has expired.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found.');
  }

  if (batch.status === 'processing' || batch.status === 'uploaded') {
    return sendError(res, 409, 'BATCH_STATE_CONFLICT', 'Batch is still converting images.');
  }

  const completedFiles = batch.files.filter((f) => f.status === 'completed' && f.output);
  if (completedFiles.length === 0) {
    return sendError(res, 409, 'NO_COMPLETED_FILES', 'No completed files to archive.');
  }

  try {
    const entries = completedFiles.map((f) => ({
      storageFilename: `${f.fileId}.jpg`,
      archiveEntryName: f.output!.filename,
    }));

    const archiveResult = await createZipArchive(batchId, entries);

    const archiveObj = {
      filename: archiveResult.filename,
      sizeBytes: archiveResult.sizeBytes,
      fileCount: completedFiles.length,
      downloadUrl: `/api/v1/batches/${batchId}/archive`,
      createdAt: new Date().toISOString(),
    };

    batch.archive = archiveObj;

    return res.status(200).json({ archive: archiveObj });
  } catch (err) {
    console.error('ZIP Archive creation failed:', err);
    return sendError(res, 500, 'ARCHIVE_FAILED', 'Failed to generate ZIP archive.');
  }
});

// 10. GET & HEAD /batches/:batchId/archive
const handleZipDownload = (req: Request, res: Response) => {
  const { batchId } = req.params;

  if (!isValidBatchId(batchId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid batch identifier format.');
  }

  if (batchStore.isTombstoned(batchId)) {
    return sendError(res, 410, 'BATCH_EXPIRED', 'Batch has expired.');
  }

  const batch = batchStore.getBatch(batchId);
  if (!batch) {
    return sendError(res, 404, 'BATCH_NOT_FOUND', 'Batch not found.');
  }

  const zipPath = getFilePath(batchId, 'bundle.zip');
  if (!fs.existsSync(zipPath)) {
    return sendError(res, 409, 'ARCHIVE_NOT_PREPARED', 'ZIP archive has not been created yet.');
  }

  const stat = fs.statSync(zipPath);
  const zipName = batch.archive?.filename || formatZipFilename();

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  fs.createReadStream(zipPath).pipe(res);
};

apiRouter.get('/batches/:batchId/archive', handleZipDownload);
apiRouter.head('/batches/:batchId/archive', handleZipDownload);

// 11. DELETE /batches/:batchId
apiRouter.delete('/batches/:batchId', (req: Request, res: Response) => {
  const { batchId } = req.params;

  if (!isValidBatchId(batchId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid batch identifier format.');
  }

  batchStore.deleteBatch(batchId, 'user');
  return res.status(204).send();
});
