import fs from 'fs';
import sharp from 'sharp';
import { CONFIG } from './config.ts';

export interface AVIFValidationSuccess {
  valid: true;
  brand: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  bitDepth: number;
  orientation?: number;
}

export interface AVIFValidationFailure {
  valid: false;
  code: 'UNSUPPORTED_FILE_TYPE' | 'CORRUPTED_FILE' | 'IMAGE_DIMENSIONS_EXCEEDED';
  message: string;
}

export type AVIFValidationResult = AVIFValidationSuccess | AVIFValidationFailure;

/**
 * Validates ISO-BMFF ftyp box header and brand in the first 32 bytes
 */
export function checkIsoBmffFtyp(buffer: Buffer): { isAvif: boolean; brand?: string } {
  if (buffer.length < 16) {
    return { isAvif: false };
  }

  // Offset 4 to 8 must be 'ftyp'
  const boxType = buffer.toString('ascii', 4, 8);
  if (boxType !== 'ftyp') {
    return { isAvif: false };
  }

  // Major brand (offset 8 to 12)
  const majorBrand = buffer.toString('ascii', 8, 12).trim();
  if (majorBrand === 'avif' || majorBrand === 'avis') {
    return { isAvif: true, brand: majorBrand };
  }

  // Compatible brands (every 4 bytes starting at offset 16 up to 32 or box size)
  const boxLength = buffer.readUInt32BE(0);
  const maxOffset = Math.min(buffer.length, boxLength > 0 ? boxLength : buffer.length);
  for (let offset = 16; offset + 4 <= maxOffset; offset += 4) {
    const brand = buffer.toString('ascii', offset, offset + 4).trim();
    if (brand === 'avif' || brand === 'avis') {
      return { isAvif: true, brand };
    }
  }

  return { isAvif: false };
}

/**
 * Full content and metadata validation of an AVIF file
 */
export async function validateAvifFile(filePath: string, originalName: string): Promise<AVIFValidationResult> {
  let fd: number | null = null;
  const headerBuf = Buffer.alloc(64);
  try {
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, headerBuf, 0, 64, 0);
    fs.closeSync(fd);
    fd = null;

    if (bytesRead < 16) {
      return {
        valid: false,
        code: bytesRead === 0 ? 'UNSUPPORTED_FILE_TYPE' : 'CORRUPTED_FILE',
        message: `“${originalName}” looks damaged and can’t be converted. Try exporting or downloading the original again.`,
      };
    }

    const bmffCheck = checkIsoBmffFtyp(headerBuf.subarray(0, bytesRead));
    if (!bmffCheck.isAvif) {
      return {
        valid: false,
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `“${originalName}” isn’t an AVIF image. Pixora currently converts .avif files only.`,
      };
    }

    // Decoder metadata verification using Sharp with pixel limit (SR-004)
    const image = sharp(filePath, {
      limitInputPixels: CONFIG.MAX_INPUT_PIXELS,
      failOn: 'error',
      sequentialRead: true,
    });

    const meta = await image.metadata();

    // Verify format and compression
    const detectedFormat = meta.format as string | undefined;
    if (detectedFormat !== 'heif' && detectedFormat !== 'avif') {
      return {
        valid: false,
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `“${originalName}” is not an AVIF image.`,
      };
    }

    // HEIC check (SR-001: reject HEIC which reports hevc)
    const compression = meta.compression as string | undefined;
    if (compression && compression !== 'av1' && compression !== 'avif') {
      return {
        valid: false,
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `“${originalName}” uses compression '${meta.compression}' rather than AV1.`,
      };
    }

    const width = meta.width || 0;
    const height = meta.height || 0;

    // Check pixel dimensions (SR-004)
    if (width * height > CONFIG.MAX_INPUT_PIXELS) {
      const mp = Math.round(CONFIG.MAX_INPUT_PIXELS / 1_000_000);
      return {
        valid: false,
        code: 'IMAGE_DIMENSIONS_EXCEEDED',
        message: `“${originalName}” is larger than ${mp} megapixels, which is the maximum Pixora can convert.`,
      };
    }

    // Bit depth (default 8 if not specified)
    const bitDepth = meta.depth === 'uchar' ? 8 : (typeof meta.depth === 'number' ? meta.depth : 8);

    return {
      valid: true,
      brand: bmffCheck.brand || 'avif',
      width,
      height,
      hasAlpha: Boolean(meta.hasAlpha),
      bitDepth,
      orientation: meta.orientation,
    };
  } catch (err: unknown) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
    const errMessage = err instanceof Error ? err.message : String(err);
    if (errMessage.includes('limitInputPixels') || errMessage.includes('exceeded')) {
      const mp = Math.round(CONFIG.MAX_INPUT_PIXELS / 1_000_000);
      return {
        valid: false,
        code: 'IMAGE_DIMENSIONS_EXCEEDED',
        message: `“${originalName}” is larger than ${mp} megapixels, which is the maximum Pixora can convert.`,
      };
    }
    return {
      valid: false,
      code: 'CORRUPTED_FILE',
      message: `“${originalName}” looks damaged and can’t be converted. Try exporting or downloading the original again.`,
    };
  }
}
