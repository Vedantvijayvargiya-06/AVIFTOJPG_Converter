/**
 * Client-side validation and schema rules
 * Requirements: FR-014, FR-018, FR-023, FR-024, UT-05, UT-08
 */

export interface ValidationLimits {
  maxFileSizeBytes: number;
  maxFilesPerBatch: number;
  maxBatchSizeBytes: number;
}

export const DEFAULT_LIMITS: ValidationLimits = {
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
  maxFilesPerBatch: 20, // 20 files
  maxBatchSizeBytes: 150 * 1024 * 1024, // 150 MB
};

export interface FileValidationResult {
  valid: boolean;
  reason?: 'UNSUPPORTED_FILE_TYPE' | 'FILE_TOO_LARGE' | 'DUPLICATE_FILE' | 'BATCH_TOO_LARGE' | 'TOO_MANY_FILES';
  message?: string;
}

export function validateSingleFile(
  file: { name: string; size: number; type?: string },
  limits: ValidationLimits = DEFAULT_LIMITS
): FileValidationResult {
  // Check extension (case insensitive) or mime
  const isAvifExt = /\.avif$/i.test(file.name);
  const isAvifMime = file.type === 'image/avif';

  if (!isAvifExt && !isAvifMime) {
    return {
      valid: false,
      reason: 'UNSUPPORTED_FILE_TYPE',
      message: `“${file.name}” isn’t an AVIF image. Pixora currently converts .avif files only.`,
    };
  }

  if (file.size > limits.maxFileSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const limitMb = Math.round(limits.maxFileSizeBytes / (1024 * 1024));
    return {
      valid: false,
      reason: 'FILE_TOO_LARGE',
      message: `“${file.name}” is ${sizeMb} MB, which is over the ${limitMb} MB limit per file.`,
    };
  }

  return { valid: true };
}

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function validateConversionOptions(options: {
  quality?: unknown;
  background?: unknown;
  [key: string]: unknown;
}): {
  valid: boolean;
  errors: string[];
  sanitized: { quality: number; background: string };
} {
  const errors: string[] = [];
  let quality = 90;
  let background = '#FFFFFF';

  // Check for unknown properties
  const allowedKeys = new Set(['quality', 'background']);
  for (const key of Object.keys(options)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unknown property '${key}'`);
    }
  }

  if (options.quality !== undefined) {
    if (typeof options.quality !== 'number' || !Number.isInteger(options.quality)) {
      errors.push('Quality must be an integer');
    } else if (options.quality < 1 || options.quality > 100) {
      errors.push('Quality must be between 1 and 100');
    } else {
      quality = options.quality;
    }
  }

  if (options.background !== undefined) {
    if (typeof options.background !== 'string' || !HEX_COLOR_REGEX.test(options.background)) {
      errors.push('Background must be a 6-digit hex color starting with # (e.g. #FFFFFF)');
    } else {
      background = options.background.toUpperCase();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: { quality, background },
  };
}
