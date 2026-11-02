import fs from 'fs';
import sharp from 'sharp';
import { CONFIG } from '../config.ts';

export interface ConvertOptions {
  quality: number;
  background: string;
}

export interface ConvertResult {
  success: boolean;
  outputFilename: string;
  outputPath: string;
  sizeBytes: number;
  width: number;
  height: number;
  error?: {
    code: string;
    message: string;
  };
}

export async function convertAvifToJpg(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions,
  displayName: string
): Promise<ConvertResult> {
  const partPath = `${outputPath}.part`;

  try {
    // Pipeline with Sharp
    let pipeline = sharp(inputPath, {
      limitInputPixels: CONFIG.MAX_INPUT_PIXELS,
      failOn: 'error',
      sequentialRead: true,
    });

    // 1. Auto-orient based on container transforms and EXIF
    pipeline = pipeline.rotate();

    // 2. Inspect metadata for alpha
    const meta = await pipeline.metadata();
    
    // 3. Flatten alpha if alpha channel is present
    if (meta.hasAlpha) {
      pipeline = pipeline.flatten({ background: options.background || '#FFFFFF' });
    }

    // 4. Convert colour space to sRGB
    pipeline = pipeline.toColorspace('srgb');

    // 5. Encode JPEG
    const quality = Math.min(100, Math.max(1, Math.round(options.quality || CONFIG.DEFAULT_JPEG_QUALITY)));
    const chromaSubsampling = quality >= 90 ? '4:4:4' : '4:2:0';

    pipeline = pipeline.jpeg({
      quality,
      chromaSubsampling,
      mozjpeg: true,
      force: true,
    });

    // Strip metadata by not calling .withMetadata()

    // 6. Atomic write to .part file
    await pipeline.toFile(partPath);

    // 7. Atomic rename
    fs.renameSync(partPath, outputPath);

    // 8. Measure output
    const stats = fs.statSync(outputPath);
    const outputMeta = await sharp(outputPath).metadata();

    // 9. Delete original immediately as per D-08 / M1
    try {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (e) {
      console.warn('Failed to delete original input file:', e);
    }

    return {
      success: true,
      outputFilename: outputPath.split('/').pop() || 'output.jpg',
      outputPath,
      sizeBytes: stats.size,
      width: outputMeta.width || meta.width || 0,
      height: outputMeta.height || meta.height || 0,
    };
  } catch (err: unknown) {
    // Cleanup partial output
    try {
      if (fs.existsSync(partPath)) {
        fs.unlinkSync(partPath);
      }
    } catch {}

    // Delete original on failure as well
    try {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch {}

    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Conversion error for ${displayName}:`, errMsg);

    return {
      success: false,
      outputFilename: '',
      outputPath: '',
      sizeBytes: 0,
      width: 0,
      height: 0,
      error: {
        code: 'CONVERSION_FAILED',
        message: `We couldn’t convert “${displayName}”. Your other images weren’t affected.`,
      },
    };
  }
}
