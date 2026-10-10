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
test('CLI rejects invalid requests before native discovery', async t => {
  const root = await sandbox(t);
  const emptyTask = await put(root, 'empty-task.txt', ' \n');
  const invalidJson = await put(root, 'invalid-evidence.json', '{');
  const staleEvidence = await put(root, 'stale-evidence.json', JSON.stringify(evidence('old task')));
  const missingFile = join(root, 'missing.txt');
  const cases = [
    { args: ['route'], message: /non-empty task/ },
    { args: ['route', ' \t '], message: /non-empty task/ },
    { args: ['route', '--task-file', emptyTask], message: /non-empty task/ },
    { args: ['route', 'example', '--task-file', missingFile], message: /not both/ },
    { args: ['scan', 'unexpected'], message: /scan takes no positional/ },
    { args: ['inspect'], message: /one exact skill id/ },
    { args: ['inspect', 'one', 'two'], message: /one exact skill id/ },
    ...['0', '21', '1.5', 'NaN', '', 'Infinity'].map(limit => ({ args: ['route', 'example', '--limit', limit], message: /integer between 1 and 20/ })),
    { args: ['route', '--task-file', missingFile], message: /ENOENT/ },
    { args: ['route', 'example', '--evidence', missingFile], message: /ENOENT/ },
    { args: ['route', 'example', '--evidence', invalidJson], message: /JSON/ },
    { args: ['route', 'example', '--evidence', staleEvidence], message: /exactly match/ }
  ];
  for (const { args, message } of cases) {
    await assert.rejects(invoke(root, [...args, '--native', '--codex-bin', 'asr-nonexistent-binary-experience']), error => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, message, args.join(' '));
      assert.doesNotMatch(error.stderr, /Unable to start Codex/);
      return true;
    });
  }
});
test('CLI valid requests still reach native discovery', async t => {
  const root = await sandbox(t);
  for (const args of [['scan'], ['inspect', 'example'], ['route', 'example', '--limit', '1'], ['route', 'example', '--limit', '20']]) {
    await assert.rejects(invoke(root, [...args, '--native', '--codex-bin', 'asr-nonexistent-binary-experience']), error => /Unable to start Codex/.test(error.stderr));
  }
});
test('CLI preserves valid catalog, route and inspect outputs', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/debug', 'debug', 'Debug root causes');
  await skill(root, 'library/debug-extra', 'debug-extra', 'Debug root causes');
  const common = ['--no-defaults', '--root', join(root, 'library'), '--json'];
  const { stdout: scanned } = await invoke(root, ['scan', ...common]);
  const catalog = JSON.parse(scanned);
  assert.equal(catalog.skills.length, 2);
  assert.deepEqual(catalog.diagnostics, []);
  const task = 'Debug failure';
  const evidenceFile = await put(root, 'evidence.json', JSON.stringify(evidence(task, { rootCauseKnown: false, production: true })));
  for (const limit of ['1', '20']) {
    const { stdout } = await invoke(root, ['route', task, '--evidence', evidenceFile, '--limit', limit, ...common]);
    const decision = JSON.parse(stdout);
    assert.equal(decision.action, 'consider-skills');
    assert.equal(decision.candidates.length, limit === '1' ? 1 : 2);
    assert.deepEqual(decision.selectedSkills, []);
    assert.equal(decision.approvalCheckRequired, true);
    assert.deepEqual(decision.diagnostics, []);
  }
  const selected = catalog.skills[0];
  const { stdout: explicitlyRequested } = await invoke(root, ['route', task, '--skill', selected.id, ...common]);
  const decision = JSON.parse(explicitlyRequested);
  assert.equal(decision.candidates[0].id, selected.id);
  assert.deepEqual(decision.selectedSkills, []);
  const { stdout: inspected } = await invoke(root, ['inspect', selected.id, ...common]);
  const inspectedSkill = JSON.parse(inspected);
  assert.deepEqual(inspectedSkill.skill, selected);
  assert.equal(inspectedSkill.content, await readFile(selected.path, 'utf8'));
  assert.match(inspectedSkill.warning, /not authorization/);
});
