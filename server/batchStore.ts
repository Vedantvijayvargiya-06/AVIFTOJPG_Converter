import { CONFIG } from './config.ts';
import { deleteBatchDirectory } from './storage.ts';
import type { BatchObject, FileItem, BatchArchive } from '../src/types/index.ts';

export interface BatchRecord extends BatchObject {
  // Internal server properties
  storageFilenames: Map<string, string>; // fileId -> storage filename (e.g. fil_xxx.jpg)
}

class BatchStore {
  private batches = new Map<string, BatchRecord>();
  private tombstones = new Map<string, number>(); // batchId -> timestamp of deletion
  private sweeperTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startSweeper();
  }

  public createBatch(batch: BatchRecord): void {
    this.batches.set(batch.batchId, batch);
  }

  public getBatch(batchId: string): BatchRecord | undefined {
    return this.batches.get(batchId);
  }

  public hasBatch(batchId: string): boolean {
    return this.batches.has(batchId);
  }

  public isTombstoned(batchId: string): boolean {
    return this.tombstones.has(batchId);
  }

  public updateBatchStatus(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    let queued = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;
    let accepted = 0;
    let rejected = 0;

    for (const f of batch.files) {
      if (f.status === 'queued') queued++;
      else if (f.status === 'processing') processing++;
      else if (f.status === 'completed') completed++;
      else if (f.status === 'failed') failed++;
      else if (f.status === 'rejected') rejected++;
      else if (f.status === 'uploaded') accepted++;

      if (f.status !== 'rejected') {
        accepted++;
      }
    }

    batch.counts = {
      total: batch.files.length,
      accepted,
      rejected,
      queued,
      processing,
      completed,
      failed,
    };

    if (queued > 0 || processing > 0) {
      batch.status = 'processing';
    } else if (completed > 0 && failed > 0) {
      batch.status = 'partially_completed';
    } else if (completed > 0 && failed === 0) {
      batch.status = 'completed';
    } else if (failed > 0 && completed === 0) {
      batch.status = 'failed';
    }
  }

  public deleteBatch(batchId: string, reason: 'expired' | 'user' | 'shutdown' = 'user'): boolean {
    const exists = this.batches.has(batchId);
    if (exists) {
      this.batches.delete(batchId);
      this.tombstones.set(batchId, Date.now());
      deleteBatchDirectory(batchId);
      return true;
    }
    return false;
  }

  public startSweeper(): void {
    if (this.sweeperTimer) return;
    this.sweeperTimer = setInterval(() => {
      this.sweepExpired();
    }, CONFIG.CLEANUP_INTERVAL_SECONDS * 1000);
  }

  public stopSweeper(): void {
    if (this.sweeperTimer) {
      clearInterval(this.sweeperTimer);
      this.sweeperTimer = null;
    }
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [batchId, batch] of this.batches.entries()) {
      const exp = new Date(batch.expiresAt).getTime();
      if (now > exp) {
        this.deleteBatch(batchId, 'expired');
      }
    }

    // Sweep old tombstones after TOMBSTONE_TTL_HOURS
    const tombstoneLimit = CONFIG.TOMBSTONE_TTL_HOURS * 60 * 60 * 1000;
    for (const [batchId, deletedTime] of this.tombstones.entries()) {
      if (now - deletedTime > tombstoneLimit) {
        this.tombstones.delete(batchId);
      }
    }
  }

  public purgeAll(): void {
    for (const batchId of this.batches.keys()) {
      deleteBatchDirectory(batchId);
    }
    this.batches.clear();
    this.tombstones.clear();
  }
}

export const batchStore = new BatchStore();
