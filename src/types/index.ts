/**
 * Pixora Shared Types and Contract Specifications
 * Reference: Section 15 & 16 of PIXORA-SRS-001
 */

export type FileStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed' | 'rejected';

export type BatchStatus = 'uploaded' | 'processing' | 'completed' | 'partially_completed' | 'failed';

export interface FileMetadata {
  sizeBytes: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  bitDepth: number;
}

export interface ConvertedOutput {
  filename: string;
  mimeType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  previewUrl: string;
  downloadUrl: string;
}

export interface FileError {
  code: string;
  message: string;
}

export interface FileItem {
  fileId: string;
  originalName: string;
  status: FileStatus;
  original: FileMetadata | null;
  output: ConvertedOutput | null;
  warnings: string[];
  error: FileError | null;
  startedAt?: string;
  finishedAt?: string;
}

export interface BatchArchive {
  filename: string;
  sizeBytes: number;
  fileCount: number;
  downloadUrl: string;
  createdAt: string;
}

export interface ConversionOptions {
  quality?: number; // 1 to 100, default 90
  background?: string; // hex color e.g. #FFFFFF
}

export interface BatchCounts {
  total: number;
  accepted: number;
  rejected: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface BatchObject {
  batchId: string;
  tool: string;
  status: BatchStatus;
  createdAt: string;
  expiresAt: string;
  pollIntervalMs: number;
  options: ConversionOptions | null;
  counts: BatchCounts;
  files: FileItem[];
  archive?: BatchArchive | null;
}

export interface PublicConfig {
  tools: {
    id: string;
    label: string;
    inputExtensions: string[];
    inputMimeTypes: string[];
    outputExtension: string;
  }[];
  limits: {
    maxFileSizeBytes: number;
    maxFilesPerBatch: number;
    maxBatchSizeBytes: number;
    maxPixels: number;
  };
  defaults: {
    quality: number;
    background: string;
  };
  quality: {
    min: number;
    max: number;
  };
  retentionMinutes: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<Record<string, unknown>>;
    requestId: string;
  };
}

export interface ClientFileEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'invalid';
  validationError?: string;
  clientPreviewUrl?: string;
}
