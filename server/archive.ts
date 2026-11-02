import fs from 'fs';
import path from 'path';
import * as archiver from 'archiver';
import { getFilePath } from './storage.ts';

export interface ArchiveEntry {
  storageFilename: string; // e.g. fil_123.jpg
  archiveEntryName: string; // e.g. holiday photo.jpg
}

export function formatZipFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `pixora-converted-${yyyy}${mm}${dd}-${hh}${mi}${ss}.zip`;
}

export async function createZipArchive(
  batchId: string,
  entries: ArchiveEntry[]
): Promise<{ filename: string; sizeBytes: number; filePath: string }> {
  const zipFinalPath = getFilePath(batchId, 'bundle.zip');
  const zipPartPath = `${zipFinalPath}.part`;

  // Check if archive already generated
  if (fs.existsSync(zipFinalPath)) {
    const stat = fs.statSync(zipFinalPath);
    return {
      filename: formatZipFilename(),
      sizeBytes: stat.size,
      filePath: zipFinalPath,
    };
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPartPath);
    // Level 0 store-only compression as per Section 19.5
    const archive = new archiver.ZipArchive({ store: true });

    output.on('close', () => {
      try {
        fs.renameSync(zipPartPath, zipFinalPath);
        const stats = fs.statSync(zipFinalPath);
        resolve({
          filename: formatZipFilename(),
          sizeBytes: stats.size,
          filePath: zipFinalPath,
        });
      } catch (err) {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      try {
        if (fs.existsSync(zipPartPath)) {
          fs.unlinkSync(zipPartPath);
        }
      } catch {}
      reject(err);
    });

    archive.pipe(output);

    for (const entry of entries) {
      const srcPath = getFilePath(batchId, entry.storageFilename);
      if (fs.existsSync(srcPath)) {
        // Safe flat file name without path components (SR-021)
        const cleanName = path.basename(entry.archiveEntryName);
        archive.file(srcPath, { name: cleanName });
      }
    }

    archive.finalize();
  });
}
