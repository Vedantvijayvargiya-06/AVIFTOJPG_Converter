/**
 * Formatting utilities for bytes, durations, and numbers
 * Requirements: FR-013, UT-07
 */

/**
 * Format bytes into human-readable units (B, KB, MB) with one decimal place for KB/MB
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Format seconds into mm:ss countdown
 */
export function formatTimeRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format percentage change e.g. -35% or +12%
 */
export function formatSizeDelta(originalBytes: number, convertedBytes: number): string {
  if (!originalBytes || !convertedBytes) return '0%';
  const diff = convertedBytes - originalBytes;
  const pct = Math.round((diff / originalBytes) * 100);
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}
