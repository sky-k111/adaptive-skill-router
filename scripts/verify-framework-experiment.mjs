import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Provide a completed experiment directory.');
const target = resolve(process.argv[2]);
const verified = spawnSync(process.execPath, [fileURLToPath(new URL('./verify-behavior-workspace.mjs', import.meta.url)), target], {
  encoding: 'utf8', windowsHide: true
});
process.stdout.write(verified.stdout ?? '');
if (verified.status !== 0) throw new Error(verified.stderr || 'Existing behavior contracts failed.');
const { batcher } = await import(pathToFileURL(join(target, '04-batch/batcher.js')).href);
const calls = [];
let release;
const gate = new Promise(resolve => { release = resolve; });
const queue = batcher(async (tenant, id) => {
  calls.push([tenant, id]);
  if (id === 'hold') await gate;
  if (id === 'missing') throw new Error('missing record');
  return { tenant, id };
});
const north = queue.read('north', 'hold');
const failure = queue.read('north', 'missing').then(() => assert.fail('Expected rejection'), error => error.message);
const south = queue.read('south', '42');
assert.equal(calls.length, 0, 'Reads must remain deferred');
const flushing = queue.flush();
const later = queue.read('west', 'later');
release();
await flushing;
assert.deepEqual(await north, { tenant: 'north', id: 'hold' });
assert.equal(await failure, 'missing record');
assert.deepEqual(await south, { tenant: 'south', id: '42' });
assert.deepEqual(calls, [['north', 'hold'], ['north', 'missing'], ['south', '42']]);
await queue.flush();
assert.deepEqual(await later, { tenant: 'west', id: 'later' });
await queue.flush();
assert.equal(calls.length, 4, 'An empty flush must not load records');
console.log('PASS independent batch isolation, FIFO, deferred reads and rejection contracts');
