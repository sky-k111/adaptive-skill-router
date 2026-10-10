import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scanSkills, readSkill, discoverRoots } from '../dist/index.js';
import { sandbox, put, skill, options } from './helpers.mjs';

test('reads folded YAML and Unicode without exposing the body in inventory', async t => {
  const root = await sandbox(t);
  await put(root, '技能/SKILL.md', '\uFEFF---\r\nname: unicode-debug\r\ndescription: >-\r\n  Diagnose a bug\r\n  using evidence.\r\n---\r\nPRIVATE_BODY_SENTINEL');
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills.length, 1);
  assert.equal(catalog.skills[0].description, 'Diagnose a bug using evidence.');
  assert.ok(!JSON.stringify(catalog).includes('PRIVATE_BODY_SENTINEL'));
  assert.ok((await readSkill(catalog.skills[0])).includes('PRIVATE_BODY_SENTINEL'));
});

test('malformed manifests are diagnosed while valid neighbors survive', async t => {
  const root = await sandbox(t);
  await skill(root, 'valid', 'valid', 'Test a behavior');
  await put(root, 'bad/SKILL.md', '---\nname: a\nname: b\ndescription: duplicate\n---\nbody');
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills.length, 1);
  assert.equal(catalog.diagnostics[0].code, 'invalid-skill');
});

test('preserves name collisions using distinct path identities', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'review', 'Review backend changes');
  await skill(root, 'two', 'review', 'Review frontend changes');
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills.length, 2);
  assert.notEqual(catalog.skills[0].id, catalog.skills[1].id);
  assert.ok(catalog.skills.every(s => s.advisories.includes('name-collision-use-path')));
});

test('symlink cycles terminate and shared manifests deduplicate', async t => {
  const root = await sandbox(t);
  await skill(root, 'original', 'original', 'Debug a problem');
  const target = join(root, 'original');
  await symlink(target, join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  await symlink(root, join(root, 'cycle'), process.platform === 'win32' ? 'junction' : 'dir');
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills.length, 1);
});

test('honors Codex explicit-only policy and disabled config', async t => {
  const root = await sandbox(t);
  const path = await skill(root, 'manual', 'manual', 'Review deployment');
  await put(root, 'manual/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  await put(root, 'home/.codex/config.toml', `[[skills.config]]\npath = ${JSON.stringify(path.replace(/\\/g, '/'))}\nenabled = false\n`);
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills[0].automatic, false);
  assert.equal(catalog.skills[0].disabled, true);
});

test('invalid restrictions fail closed for automatic routing, without leaking configuration', async t => {
  const root = await sandbox(t);
  await skill(root, 'debug', 'debug', 'Diagnose root cause');
  await put(root, 'home/.codex/config.toml', 'secret = "PRIVATE_SECRET\n');
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills[0].automatic, false);
  assert.equal(catalog.diagnostics[0].code, 'config-invalid');
  assert.ok(!JSON.stringify(catalog).includes('PRIVATE_SECRET'));
});

test('plugin caches are visible only as unverified inventory', async t => {
  const root = await sandbox(t);
  await skill(root, 'cache/plugin', 'cached', 'Review code');
  const catalog = await scanSkills({ ...options(root), roots: [{ path: join(root, 'cache'), host: 'codex', scope: 'plugin-cache' }] });
  assert.equal(catalog.skills[0].availability, 'unverified-plugin');
});

test('root discovery includes project ancestor roots only within the repository', async t => {
  const root = await sandbox(t);
  await mkdir(join(root, 'repo', '.git'), { recursive: true });
  await mkdir(join(root, 'repo', 'nested'), { recursive: true });
  const roots = await discoverRoots({ cwd: join(root, 'repo', 'nested'), home: join(root, 'home'), env: {} });
  assert.ok(roots.some(r => r.path === join(root, 'repo', '.agents', 'skills')));
  assert.ok(!roots.some(r => r.path === join(root, '.agents', 'skills')));
  assert.ok(roots.every(r => r.host === 'codex'));
});

test('detects content changes before on-demand loading', async t => {
  const root = await sandbox(t);
  const path = await skill(root, 'one', 'one', 'Plan a feature');
  const catalog = await scanSkills(options(root));
  await writeFile(path, 'changed');
  await assert.rejects(readSkill(catalog.skills[0]), /changed after discovery/);
});

test('non-Git child discovery reports its boundary without scanning ancestor skills', async t => {
  const root = await sandbox(t);
  const project = join(root, 'project');
  const nested = join(project, 'nested');
  await mkdir(nested, { recursive: true });
  await skill(project, '.agents/skills/local', 'project-debug', 'Diagnose request isolation');
  const common = { home: join(root, 'home'), env: {} };
  const child = await scanSkills({ ...common, cwd: nested });
  assert.equal(child.skills.length, 0);
  assert.ok(child.diagnostics.some(d => d.code === 'project-scope-current-directory' && d.path === nested));
  const parent = await scanSkills({ ...common, cwd: project });
  assert.deepEqual(parent.skills.map(s => s.name), ['project-debug']);
  const explicit = await scanSkills({ ...common, cwd: nested, extraRoots: [join(project, '.agents/skills')] });
  assert.deepEqual(explicit.skills.map(s => s.name), ['project-debug']);
});

test('enforces bounded traversal and oversized manifest limits', async t => {
  const root = await sandbox(t);
  await put(root, 'large/SKILL.md', 'x'.repeat(512 * 1024 + 1));
  const catalog = await scanSkills(options(root));
  assert.equal(catalog.skills.length, 0);
  assert.equal(catalog.diagnostics[0].code, 'invalid-skill');
  const limited = await scanSkills({ ...options(root), maxFiles: 1 });
  assert.ok(limited.diagnostics.some(d => d.code === 'scan-limit'));
});
