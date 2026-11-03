import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateClientZip, buildClientBatchObject } from '../utils/clientConverter.ts';
import type { FileItem } from '../types/index.ts';

test('UT-09: buildClientBatchObject constructs valid BatchObject with accurate counts', () => {
  const dummyFiles: FileItem[] = [
    {
      fileId: 'fil_test1',
      originalName: 'photo1.avif',
      status: 'completed',
      original: { sizeBytes: 1000, width: 800, height: 600, hasAlpha: false, bitDepth: 8 },
      output: {
        filename: 'photo1.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 800,
        width: 800,
        height: 600,
        previewUrl: 'blob:http://localhost/test1',
        downloadUrl: 'blob:http://localhost/test1',
      },
      warnings: [],
      error: null,
    },
    {
      fileId: 'fil_test2',
      originalName: 'photo2.avif',
      status: 'failed',
      original: null,
      output: null,
      warnings: [],
      error: { code: 'DECODE_ERROR', message: 'Invalid AVIF header' },
    },
  ];

  const batch = buildClientBatchObject(dummyFiles, { quality: 85, background: '#FFFFFF' });

  assert.ok(batch.batchId.startsWith('client_'));
  assert.equal(batch.tool, 'avif-to-jpg');
  assert.equal(batch.status, 'partially_completed');
  assert.equal(batch.counts.total, 2);
  assert.equal(batch.counts.completed, 1);
  assert.equal(batch.counts.failed, 1);
  assert.equal(batch.options?.quality, 85);
});

test('UT-10: generateClientZip packages files and handles duplicate filenames', async () => {
  // Mock global URL if running in Node test runner
  if (typeof globalThis.URL.createObjectURL !== 'function') {
    globalThis.URL.createObjectURL = () => 'blob:mock-zip-url';
  }

  const blob1 = new Blob(['mock jpeg content 1'], { type: 'image/jpeg' });
  const blob2 = new Blob(['mock jpeg content 2'], { type: 'image/jpeg' });

  // Both have same filename "photo.jpg"
  const zipResult = await generateClientZip([
    { filename: 'photo.jpg', blob: blob1 },
    { filename: 'photo.jpg', blob: blob2 },
  ]);

  assert.ok(zipResult.filename.startsWith('pixora_converted_'));
  assert.ok(zipResult.filename.endsWith('.zip'));
  assert.ok(zipResult.sizeBytes > 0);
  assert.ok(zipResult.url.startsWith('blob:'));
});
