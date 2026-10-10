import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Provide a fresh, explicit experiment directory.');
const target = resolve(process.argv[2]);
const created = spawnSync(process.execPath, [join(project, 'scripts/create-behavior-workspace.mjs'), target], {
  cwd: project, encoding: 'utf8', windowsHide: true
});
if (created.status !== 0) throw new Error(created.stderr || 'Workspace creation failed.');
await mkdir(join(target, '04-batch'));
await writeFile(join(target, '04-batch/package.json'), '{"type":"module","scripts":{"test":"node --test"}}\n');
await writeFile(join(target, '04-batch/batcher.js'), `export function batcher(load) {
  const pending = [];
  let currentTenant;
  return {
    read(tenant, id) {
      currentTenant = tenant;
      return new Promise((resolve, reject) => pending.push({ id, resolve, reject }));
    },
    async flush() {
      const batch = pending.splice(0);
      for (const request of batch) {
        try { request.resolve(await load(currentTenant, request.id)); }
        catch (error) { request.reject(error); }
      }
    }
  };
}
`);
await writeFile(join(target, '04-batch/batcher.test.js'), `import test from 'node:test';
import assert from 'node:assert/strict';
import { batcher } from './batcher.js';
test('a queued read is loaded on flush', async () => {
  const queue = batcher(async (tenant, id) => ({ tenant, id }));
  const result = queue.read('north', '42');
  await queue.flush();
  assert.deepEqual(await result, { tenant: 'north', id: '42' });
});
`);
const tasks = await readFile(join(target, 'TASKS.md'), 'utf8');
await writeFile(join(target, 'TASKS.md'), tasks.replace('Complete tasks in order.', `4. In 04-batch, queued reads from different tenants sometimes return another tenant's data. Diagnose and fix isolation while preserving the read/flush API, FIFO loading within a batch, deferred loading until flush, and per-request rejection without dropping later reads. Verify the behavior without time-based sleeps.\n\nComplete tasks in order.`));
console.log(target);
