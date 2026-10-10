import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { sandbox, put, skill, evidence } from './helpers.mjs';
const run = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
async function invoke(root, args) {
  return run(process.execPath, [cli, ...args, '--cwd', root], { cwd: root, windowsHide: true });
}
test('CLI task files preserve arbitrary text without evaluating it', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/debug', 'debug', 'Debug root causes');
  const task = 'Fix literal $(Get-Secret) `value` and quotes "x"';
  const taskFile = await put(root, 'task.txt', task + '\n');
  const evidenceFile = await put(root, 'evidence.json', JSON.stringify(evidence(task)));
  const { stdout } = await invoke(root, ['route', '--task-file', taskFile, '--evidence', evidenceFile, '--no-defaults', '--root', join(root, 'library'), '--json']);
  assert.equal(JSON.parse(stdout).action, 'direct');
  assert.equal(await readFile(taskFile, 'utf8'), task + '\n');
});
test('CLI preview leaves the selected project unchanged', async t => {
  const root = await sandbox(t);
  const { stdout } = await invoke(root, ['init', '--json']);
  assert.equal(JSON.parse(stdout).written, false);
  assert.deepEqual(await readdir(root), []);
});
test('CLI rejects mixed native and disk discovery and unsupported hosts', async t => {
  const root = await sandbox(t);
  await assert.rejects(invoke(root, ['scan', '--native', '--root', root]), error => /do not combine/.test(error.stderr));
  await assert.rejects(invoke(root, ['scan', '--host', 'claude']), error => /Unknown option/.test(error.stderr));
});
