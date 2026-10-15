import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';
import { PassThrough, Writable } from 'node:stream';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { listNativeSkills, scanNativeSkills, readSkill } from '../dist/index.js';
import { sandbox, put, skill, options } from './helpers.mjs';

// Replace only the external CLI with an in-memory protocol server. Discovery and
// manifest/policy reads still run through the production implementation.
function nativeRuntime(t, root, records) {
  t.mock.method(childProcess, 'spawn', (binary, args) => {
    assert.equal(binary, 'asr-test-native');
    assert.deepEqual(args, ['app-server']);
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new Writable({ write(chunk, encoding, callback) {
      const message = JSON.parse(chunk.toString());
      let result;
      if (message.method === 'initialize') result = {};
      if (message.method === 'skills/list') result = { data: [{ cwd: root, skills: records }] };
      if (result) queueMicrotask(() => child.stdout.write(JSON.stringify({ id: message.id, result }) + '\n'));
      callback();
    } });
    child.kill = () => true;
    return child;
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  return { ...options(root), binary: 'asr-test-native', timeoutMs: 5000 };
}

test('missing native CLI fails clearly without claiming disk discovery as runtime state', async t => {
  const root = await sandbox(t);
  await assert.rejects(listNativeSkills(root, 'asr-nonexistent-binary-xyz', 1000), /Unable to start/);
});

test('a deleted runtime manifest never promotes an unlisted nested skill', async t => {
  const root = await sandbox(t);
  const parent = await skill(root, 'parent', 'parent', 'Review CLI behavior');
  await skill(root, 'parent/nested', 'unlisted-nested', 'Review CLI behavior');
  const survivor = await skill(root, 'survivor', 'survivor', 'Review CLI behavior');
  const settings = nativeRuntime(t, root, [
    { name: 'parent', path: parent, enabled: true },
    { name: 'survivor', path: survivor, enabled: true }
  ]);
  assert.deepEqual((await scanNativeSkills(settings)).skills.map(s => s.name), ['parent', 'survivor']);
  await rm(parent);
  const catalog = await scanNativeSkills(settings);
  assert.deepEqual(catalog.skills.map(s => s.name), ['survivor']);
  const bounded = await scanNativeSkills({ ...settings, maxFiles: 2 });
  assert.deepEqual(bounded.skills.map(s => s.name), ['survivor']);
});

test('a nested skill remains discoverable when the runtime explicitly lists it', async t => {
  const root = await sandbox(t);
  const parent = await skill(root, 'parent', 'parent', 'Review CLI behavior');
  const nested = await skill(root, 'parent/nested', 'listed-nested', 'Review CLI behavior');
  await rm(parent);
  const settings = nativeRuntime(t, root, [
    { name: 'parent', path: parent, enabled: true },
    { name: 'listed-nested', path: nested, enabled: false }
  ]);
  const catalog = await scanNativeSkills(settings);
  assert.deepEqual(catalog.skills.map(s => s.name), ['listed-nested']);
  assert.equal(catalog.skills[0].disabled, true);
  assert.ok(catalog.skills[0].advisories.includes('native-cli-discovery-not-desktop-session'));
});

test('a different manifest in a listed directory is not a runtime-listed skill', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'unlisted', 'Review CLI behavior');
  const settings = nativeRuntime(t, root, [
    { name: 'missing', path: join(root, 'one', 'missing.md'), enabled: true }
  ]);
  assert.deepEqual((await scanNativeSkills(settings)).skills, []);
});

test('native enablement never relaxes disabled or explicit-only local policies', async t => {
  const root = await sandbox(t);
  const records = [];
  for (const name of ['available', 'runtime-disabled', 'local-disabled', 'explicit-only']) {
    records.push({ name, path: await skill(root, name, name, 'Review CLI behavior'), enabled: name !== 'runtime-disabled' });
  }
  await put(root, 'explicit-only/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  const disabledPath = records.find(s => s.name === 'local-disabled').path;
  await put(root, 'home/.codex/config.toml', `[[skills.config]]\npath = ${JSON.stringify(disabledPath.replace(/\\/g, '/'))}\nenabled = false\n`);
  const catalog = await scanNativeSkills(nativeRuntime(t, root, records));
  assert.deepEqual(catalog.skills.map(s => [s.name, s.disabled, s.automatic, s.userInvocable]), [
    ['available', false, true, true],
    ['explicit-only', false, false, true],
    ['local-disabled', true, true, true],
    ['runtime-disabled', true, true, true]
  ]);
  assert.ok(catalog.skills.every(s => s.advisories.includes('native-cli-discovery-not-desktop-session')));
});

test('native discovery preserves stale instruction and invocation metadata checks', async t => {
  const root = await sandbox(t);
  const path = await skill(root, 'one', 'one', 'Review CLI behavior');
  const settings = nativeRuntime(t, root, [{ name: 'one', path, enabled: true }]);
  const [original] = (await scanNativeSkills(settings)).skills;
  assert.equal(typeof await readSkill(original), 'string');
  await put(root, 'one/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  await assert.rejects(readSkill(original), /rescan/);
  const [restricted] = (await scanNativeSkills(settings)).skills;
  assert.equal(restricted.automatic, false);
  await assert.rejects(readSkill(restricted, { expectedFingerprint: original.inspectionFingerprint }), /rescan/);
  await skill(root, 'one', 'one', 'Review CLI behavior', 'Changed instructions.');
  await assert.rejects(readSkill(restricted), /rescan/);
  const [fresh] = (await scanNativeSkills(settings)).skills;
  assert.match(await readSkill(fresh, { expectedFingerprint: fresh.inspectionFingerprint }), /Changed instructions/);
});
