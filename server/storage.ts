import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.ts';

// Initialize storage root
export function initStorage(): void {
  try {
    if (!fs.existsSync(CONFIG.STORAGE_DIR)) {
      fs.mkdirSync(CONFIG.STORAGE_DIR, { recursive: true, mode: 0o700 });
    }
  } catch (err) {
    console.error('Failed to initialise storage directory:', err);
  }
}

export function getBatchDir(batchId: string): string {
  // Validate batchId structure to prevent path traversal
  const cleanId = batchId.replace(/[^a-zA-Z0-9_-]/g, '');
  const dir = path.join(CONFIG.STORAGE_DIR, cleanId);
  const resolved = path.resolve(dir);
  const resolvedRoot = path.resolve(CONFIG.STORAGE_DIR);
  
  if (!resolved.startsWith(resolvedRoot)) {
    throw new Error('Path traversal attempt detected');
  }
  return resolved;
}

export function ensureBatchDir(batchId: string): string {
  const dir = getBatchDir(batchId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return dir;
}

export function getFilePath(batchId: string, filename: string): string {
  const dir = getBatchDir(batchId);
  const cleanFilename = path.basename(filename);
  const fullPath = path.join(dir, cleanFilename);
  const resolved = path.resolve(fullPath);
  
  if (!resolved.startsWith(dir)) {
    throw new Error('Path traversal attempt detected in filename');
  }
  return resolved;
}

export function deleteBatchDirectory(batchId: string): void {
  try {
    const dir = getBatchDir(batchId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to delete batch directory ${batchId}:`, err);
  }
}

export function checkStorageWritable(): boolean {
  try {
    initStorage();
    const testFile = path.join(CONFIG.STORAGE_DIR, `.health_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}
