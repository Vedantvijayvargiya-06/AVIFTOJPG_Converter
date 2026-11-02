import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitiseFilename, resolveBatchOutputNames } from '../utils/filename.ts';
import { formatBytes, formatTimeRemaining, formatSizeDelta } from '../utils/format.ts';
import { generateBatchId, generateFileId, isValidBatchId, isValidFileId } from '../utils/id.ts';
import { validateSingleFile, validateConversionOptions } from '../utils/validation.ts';

test('UT-01: Filename sanitisation strips dangerous characters and normalises', () => {
  // Test paths, control chars, symbols, empty strings, and long names
  assert.equal(sanitiseFilename('../../etc/passwd.avif'), 'passwd');
  assert.equal(sanitiseFilename('a<b>:c.avif'), 'abc');
  assert.equal(sanitiseFilename('.hidden.avif'), 'hidden');
  assert.equal(sanitiseFilename(''), 'image');
  assert.equal(sanitiseFilename('   '), 'image');
  
  // 300-char name truncated to <= 100
  const longName = 'a'.repeat(300) + '.avif';
  const cleanLong = sanitiseFilename(longName);
  assert.ok(cleanLong.length <= 100);
  assert.equal(cleanLong.length, 100);

  // Unicode letters preserved in NFC
  const unicodeName = 'café_résumé_写真.avif';
  assert.equal(sanitiseFilename(unicodeName), 'café_résumé_写真');
});

test('UT-02: Output-name collision resolution handles duplicate names', () => {
  const inputs = ['photo.avif', 'Photo.AVIF', 'photo.avif', 'photo-1.avif'];
  const outputs = resolveBatchOutputNames(inputs);
  assert.deepEqual(outputs, [
    'photo.jpg',
    'Photo-1.jpg',
    'photo-2.jpg',
    'photo-1-1.jpg',
  ]);
});

test('UT-05: Conversion option validation', () => {
  // Valid options
  const validRes = validateConversionOptions({ quality: 90, background: '#FFFFFF' });
  assert.equal(validRes.valid, true);
  assert.equal(validRes.sanitized.quality, 90);
  assert.equal(validRes.sanitized.background, '#FFFFFF');

  // Edge cases
  assert.equal(validateConversionOptions({ quality: 1 }).valid, true);
  assert.equal(validateConversionOptions({ quality: 100 }).valid, true);

  // Invalid cases
  assert.equal(validateConversionOptions({ quality: 0 }).valid, false);
  assert.equal(validateConversionOptions({ quality: 101 }).valid, false);
  assert.equal(validateConversionOptions({ quality: 85.5 }).valid, false);
  assert.equal(validateConversionOptions({ quality: '90' as unknown as number }).valid, false);
  assert.equal(validateConversionOptions({ background: '#FFF' }).valid, false); // must be 6 hex digits
  assert.equal(validateConversionOptions({ background: 'red' }).valid, false);
  assert.equal(validateConversionOptions({ background: '#GGGGGG' }).valid, false);
  assert.equal(validateConversionOptions({ extraProperty: 123 }).valid, false);
});

test('UT-06: Identifier generation and pattern validation', () => {
  for (let i = 0; i < 1000; i++) {
    const bId = generateBatchId();
    const fId = generateFileId();
    assert.ok(isValidBatchId(bId), `Invalid batch id: ${bId}`);
    assert.ok(isValidFileId(fId), `Invalid file id: ${fId}`);
  }

  assert.equal(isValidBatchId('invalid_id'), false);
  assert.equal(isValidBatchId('bch_123'), false);
  assert.equal(isValidFileId('fil_xyz'), false);
});

test('UT-07: Size formatting produces human-readable strings with one decimal', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1023), '1023 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1048576), '1.0 MB');
  assert.equal(formatBytes(26214400), '25.0 MB');
});

test('UT-08: Client-side validation checks extension, size and limits', () => {
  const limits = {
    maxFileSizeBytes: 25 * 1024 * 1024,
    maxFilesPerBatch: 20,
    maxBatchSizeBytes: 150 * 1024 * 1024,
  };

  // Valid AVIF
  assert.equal(validateSingleFile({ name: 'holiday.avif', size: 1024 }, limits).valid, true);
  assert.equal(validateSingleFile({ name: 'PHOTO.AVIF', size: 1024 }, limits).valid, true);

  // Wrong extension
  const wrongExt = validateSingleFile({ name: 'notes.txt', size: 1024 }, limits);
  assert.equal(wrongExt.valid, false);
  assert.equal(wrongExt.reason, 'UNSUPPORTED_FILE_TYPE');

  // Oversized file
  const oversize = validateSingleFile({ name: 'large.avif', size: 26 * 1024 * 1024 }, limits);
  assert.equal(oversize.valid, false);
  assert.equal(oversize.reason, 'FILE_TOO_LARGE');
});
