import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSampleAvif } from '../../server/sampleAvif.ts';
import { checkIsoBmffFtyp } from '../../server/validator.ts';
import { convertAvifToJpg } from '../../server/converters/avifToJpg.ts';
import fs from 'fs';
import path from 'path';
import os from 'os';

test('INT-01: AVIF sample generation, ISO-BMFF validation, and Sharp conversion to JPEG', async () => {
  // 1. Generate real AVIF
  const avifBuffer = await generateSampleAvif(400, 300, true);
  assert.ok(avifBuffer.length > 500, 'AVIF buffer should have substantial data');

  // 2. Validate ISO-BMFF header
  const bmff = checkIsoBmffFtyp(avifBuffer.subarray(0, 32));
  assert.equal(bmff.isAvif, true);

  // 3. Write temp file and convert with Sharp
  const tmpDir = path.join(os.tmpdir(), `pixora_test_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const inputAvif = path.join(tmpDir, 'test.avif');
  const outputJpg = path.join(tmpDir, 'test.jpg');
  fs.writeFileSync(inputAvif, avifBuffer);

  const result = await convertAvifToJpg(
    inputAvif,
    outputJpg,
    { quality: 90, background: '#FFFFFF' },
    'test.avif'
  );

  assert.equal(result.success, true);
  assert.ok(result.sizeBytes > 0);
  assert.equal(result.width, 400);
  assert.equal(result.height, 300);
  assert.ok(fs.existsSync(outputJpg));

  // Check JPEG SOI marker (0xFFD8) as per INT-01
  const jpgBytes = fs.readFileSync(outputJpg);
  assert.equal(jpgBytes[0], 0xFF);
  assert.equal(jpgBytes[1], 0xD8);

  // Check original was deleted immediately as per D-08 / M1
  assert.equal(fs.existsSync(inputAvif), false);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
