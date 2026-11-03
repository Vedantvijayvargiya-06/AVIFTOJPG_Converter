/**
 * Client-Side In-Browser AVIF to JPG Converter & ZIP Generator
 * Allows Pixora to run 100% offline and serverless (e.g. on Vercel, Netlify, GitHub Pages, or local offline)
 * Uses HTML5 Canvas, createImageBitmap, and JSZip
 */

import JSZip from 'jszip';
import type { FileItem, ConversionOptions, BatchObject } from '../types/index.ts';
import { generateFileId } from './id.ts';
import { sanitiseFilename } from './filename.ts';

/**
 * Checks if the current browser environment can decode AVIF images
 */
export async function checkBrowserAvifSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1x1 transparent AVIF image data URI
  const avifDataUri =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAG1pZjFhdmlmZHVtbXkAAAABbWV0YQAAAAAAAAAOcGl0bQAAAAEAAAAadGlsZQAAAAEAAAAFaW5mZQAAAAABAAAABmluZmM=';

  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width === 1 && img.height === 1);
    };
    img.onerror = () => {
      // Fallback check: createImageBitmap support
      if (typeof createImageBitmap === 'function') {
        resolve(true); // Modern browser with Canvas/Bitmap engine
      } else {
        resolve(false);
      }
    };
    img.src = avifDataUri;
  });
}

/**
 * Probes the backend server to see if /api/v1 is reachable
 */
export async function checkBackendOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch('/api/v1/health', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export interface ClientConvertedResult {
  fileItem: FileItem;
  blob: Blob;
  previewUrl: string;
  downloadUrl: string;
}

/**
 * Converts an AVIF file to JPG directly in the browser via Canvas
 */
export async function convertAvifToJpgClient(
  file: File,
  options: ConversionOptions = { quality: 90, background: '#FFFFFF' }
): Promise<ClientConvertedResult> {
  const quality = Math.max(1, Math.min(100, options.quality ?? 90)) / 100;
  const background = options.background || '#FFFFFF';
  const fileId = generateFileId();
  const startTime = new Date().toISOString();

  // Step 1: Decode image bitmap or fallback to Image element
  let width = 0;
  let height = 0;
  let imageSource: ImageBitmap | HTMLImageElement;

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      imageSource = bitmap;
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to decode AVIF image in browser.'));
        img.src = url;
      });
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;
      imageSource = img;
      URL.revokeObjectURL(url);
    }
  } catch (decodeErr) {
    // If browser couldn't decode AVIF
    throw new Error(
      `Your browser could not decode "${file.name}". Please ensure your browser supports AVIF (Chrome 85+, Safari 16.4+, Firefox 93+, Edge 121+).`
    );
  }

  // Step 2: Render onto canvas with background color for alpha channel
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Canvas 2D context could not be created.');
  }

  // Fill background (default white) to prevent black transparent areas
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Draw source image
  ctx.drawImage(imageSource, 0, 0, width, height);

  // Close bitmap if applicable
  if ('close' in imageSource && typeof imageSource.close === 'function') {
    imageSource.close();
  }

  // Step 3: Convert canvas to JPEG blob
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas export to JPEG failed.'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  const previewUrl = URL.createObjectURL(jpegBlob);
  const downloadUrl = previewUrl;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const sanitizedName = sanitiseFilename(baseName) || 'image';
  const outputFilename = `${sanitizedName}.jpg`;

  const fileItem: FileItem = {
    fileId,
    originalName: file.name,
    status: 'completed',
    original: {
      sizeBytes: file.size,
      width,
      height,
      hasAlpha: false,
      bitDepth: 8,
    },
    output: {
      filename: outputFilename,
      mimeType: 'image/jpeg',
      sizeBytes: jpegBlob.size,
      width,
      height,
      previewUrl,
      downloadUrl,
    },
    warnings: [],
    error: null,
    startedAt: startTime,
    finishedAt: new Date().toISOString(),
  };

  return {
    fileItem,
    blob: jpegBlob,
    previewUrl,
    downloadUrl,
  };
}

/**
 * Packages multiple converted files into a ZIP file client-side using JSZip
 */
export async function generateClientZip(
  files: Array<{ filename: string; blob: Blob }>
): Promise<{ blob: Blob; url: string; filename: string; sizeBytes: number }> {
  const zip = new JSZip();

  // Deduplicate filenames if multiple files share the same name
  const usedNames = new Set<string>();

  for (const item of files) {
    let name = item.filename;
    let counter = 1;
    const base = name.replace(/\.jpg$/i, '');
    while (usedNames.has(name)) {
      name = `${base}_${counter}.jpg`;
      counter++;
    }
    usedNames.add(name);
    zip.file(name, item.blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipBlob);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `pixora_converted_${dateStr}.zip`;

  return {
    blob: zipBlob,
    url,
    filename,
    sizeBytes: zipBlob.size,
  };
}

/**
 * Creates a synthetic local BatchObject for completed client-side conversions
 */
export function buildClientBatchObject(
  fileItems: FileItem[],
  options: ConversionOptions,
  zipArchive?: { filename: string; sizeBytes: number; downloadUrl: string; fileCount: number } | null
): BatchObject {
  const completedCount = fileItems.filter((f) => f.status === 'completed').length;
  const failedCount = fileItems.filter((f) => f.status === 'failed').length;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour memory retention indicator

  return {
    batchId: `client_${Date.now()}`,
    tool: 'avif-to-jpg',
    status: failedCount > 0 ? (completedCount > 0 ? 'partially_completed' : 'failed') : 'completed',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    pollIntervalMs: 1000,
    options,
    counts: {
      total: fileItems.length,
      accepted: fileItems.length,
      rejected: 0,
      queued: 0,
      processing: 0,
      completed: completedCount,
      failed: failedCount,
    },
    files: fileItems,
    archive: zipArchive
      ? {
          filename: zipArchive.filename,
          sizeBytes: zipArchive.sizeBytes,
          fileCount: zipArchive.fileCount,
          downloadUrl: zipArchive.downloadUrl,
          createdAt: now.toISOString(),
        }
      : null,
  };
}
