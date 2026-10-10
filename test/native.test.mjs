import test from 'node:test';
import assert from 'node:assert/strict';
import { listNativeSkills } from '../dist/index.js';
import { sandbox } from './helpers.mjs';

test('missing native CLI fails clearly without claiming disk discovery as runtime state', async t => {
  const root = await sandbox(t);
  await assert.rejects(listNativeSkills(root, 'asr-nonexistent-binary-xyz', 1000), /Unable to start/);
});
