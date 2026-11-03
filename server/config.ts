import os from 'os';
import path from 'path';

export const CONFIG = {
  PORT: process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  STORAGE_DIR: process.env.STORAGE_DIR || path.join(os.tmpdir(), 'pixora'),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  MAX_FILES_PER_BATCH: parseInt(process.env.MAX_FILES_PER_BATCH || '20', 10),
  MAX_BATCH_TOTAL_MB: parseInt(process.env.MAX_BATCH_TOTAL_MB || '150', 10),
  MAX_INPUT_PIXELS: parseInt(process.env.MAX_INPUT_PIXELS || '50000000', 10), // 50 MP
  DEFAULT_JPEG_QUALITY: parseInt(process.env.DEFAULT_JPEG_QUALITY || '90', 10),
  DEFAULT_BACKGROUND_COLOR: process.env.DEFAULT_BACKGROUND_COLOR || '#FFFFFF',
  RETENTION_MINUTES: parseInt(process.env.RETENTION_MINUTES || '30', 10),
  CLEANUP_INTERVAL_SECONDS: parseInt(process.env.CLEANUP_INTERVAL_SECONDS || '60', 10),
  CONVERSION_CONCURRENCY: parseInt(process.env.CONVERSION_CONCURRENCY || '2', 10),
  CONVERSION_TIMEOUT_SECONDS: parseInt(process.env.CONVERSION_TIMEOUT_SECONDS || '60', 10),
  TOMBSTONE_TTL_HOURS: parseInt(process.env.TOMBSTONE_TTL_HOURS || '24', 10),
  APP_VERSION: '1.0.0',
};

export function getPublicConfig() {
  return {
    tools: [
      {
        id: 'avif-to-jpg',
        label: 'AVIF to JPG',
        inputExtensions: ['.avif'],
        inputMimeTypes: ['image/avif'],
        outputExtension: '.jpg',
      },
    ],
    limits: {
      maxFileSizeBytes: CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
      maxFilesPerBatch: CONFIG.MAX_FILES_PER_BATCH,
      maxBatchSizeBytes: CONFIG.MAX_BATCH_TOTAL_MB * 1024 * 1024,
      maxPixels: CONFIG.MAX_INPUT_PIXELS,
    },
    defaults: {
      quality: CONFIG.DEFAULT_JPEG_QUALITY,
      background: CONFIG.DEFAULT_BACKGROUND_COLOR,
    },
    quality: {
      min: 1,
      max: 100,
    },
    retentionMinutes: CONFIG.RETENTION_MINUTES,
  };
}
