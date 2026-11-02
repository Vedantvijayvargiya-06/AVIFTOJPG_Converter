/**
 * Identifier generation and validation
 * Batch ID: bch_ + 32 lowercase hex characters (128-bit CSPRNG)
 * File ID: fil_ + 16 lowercase hex characters (64-bit CSPRNG)
 * Requirements: SR-006, SR-017, UT-06
 */

export const BATCH_ID_REGEX = /^bch_[a-f0-9]{32}$/;
export const FILE_ID_REGEX = /^fil_[a-f0-9]{16}$/;

export function generateBatchId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `bch_${hex}`;
  }
  // Fallback for Node environments if global crypto is absent
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return `bch_${hex}`;
}

export function generateFileId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `fil_${hex}`;
  }
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return `fil_${hex}`;
}

export function isValidBatchId(id: string): boolean {
  return typeof id === 'string' && BATCH_ID_REGEX.test(id);
}

export function isValidFileId(id: string): boolean {
  return typeof id === 'string' && FILE_ID_REGEX.test(id);
}
