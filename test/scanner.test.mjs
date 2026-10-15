import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, symlink, writeFile, rm } from 'node:fs/promises';
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

test('a redirected skill directory is stale even when both manifests contain identical bytes', async t => {
  const root = await sandbox(t);
  const content = '---\nname: same\ndescription: Review CLI behavior\n---\nSame instructions\n';
  await put(root, 'first/SKILL.md', content);
  await put(root, 'second/SKILL.md', content);
  const alias = join(root, 'active');
  await symlink(join(root, 'first'), alias, process.platform === 'win32' ? 'junction' : 'dir');
  const settings = { ...options(root), roots: [{ path: alias, host: 'codex', scope: 'custom' }] };
  const [candidate] = (await scanSkills(settings)).skills;
  assert.equal(await readSkill(candidate), content);
  // The named junction lies inside this disposable test root; do not remove its target.
  assert.equal(join(root, 'active'), alias);
  await rm(alias, { recursive: true });
  await symlink(join(root, 'second'), alias, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(readSkill(candidate), /changed after discovery|rescan/);
  const [fresh] = (await scanSkills(settings)).skills;
  assert.equal(await readSkill(fresh), content);
  assert.notEqual(fresh.realPath, candidate.realPath);
});

test('invocation metadata changes invalidate a cached selection without changing instructions', async t => {
  for (const change of ['added', 'changed', 'removed']) await t.test(change, async t => {
    const root = await sandbox(t);
    await skill(root, 'one', 'one', 'Review CLI behavior');
    const policy = join(root, 'one/agents/openai.yaml');
    if (change !== 'added') await put(root, 'one/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: true\n');
    const [candidate] = (await scanSkills(options(root))).skills;
    if (change === 'removed') await rm(policy);
    else await put(root, 'one/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
    await assert.rejects(readSkill(candidate), /changed after discovery|rescan/);
    const [fresh] = (await scanSkills(options(root))).skills;
    assert.equal(fresh.automatic, change === 'removed');
    assert.equal(typeof await readSkill(fresh), 'string');
  });
});

test('redirected invocation metadata is stale even with identical policy contents', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'one', 'Review CLI behavior');
  const policy = 'policy:\n  allow_implicit_invocation: false\n';
  await put(root, 'first/openai.yaml', policy);
  await put(root, 'second/openai.yaml', policy);
  const alias = join(root, 'one', 'agents');
  await symlink(join(root, 'first'), alias, process.platform === 'win32' ? 'junction' : 'dir');
  const [candidate] = (await scanSkills(options(root))).skills;
  assert.equal(candidate.automatic, false);
  // Only replace this named junction inside the disposable test root.
  assert.equal(alias, join(root, 'one', 'agents'));
  await rm(alias, { recursive: true });
  await symlink(join(root, 'second'), alias, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(readSkill(candidate), /rescan/);
  const [fresh] = (await scanSkills(options(root))).skills;
  assert.equal(fresh.fingerprint, candidate.fingerprint);
  assert.notEqual(fresh.inspectionFingerprint, candidate.inspectionFingerprint);
  assert.equal(fresh.automatic, false);
  assert.equal(typeof await readSkill(fresh), 'string');
});

test('dependency changes invalidate inspection without disclosing metadata in the catalog', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'one', 'Review CLI behavior');
  await put(root, 'one/agents/openai.yaml', 'dependencies:\n  tools:\n    - value: PRIVATE_TOOL_A\n');
  const [candidate] = (await scanSkills(options(root))).skills;
  assert.ok(candidate.advisories.includes('declared-tool-dependencies'));
  assert.doesNotMatch(JSON.stringify(candidate), /PRIVATE_TOOL/);
  await put(root, 'one/agents/openai.yaml', 'dependencies:\n  tools:\n    - value: PRIVATE_TOOL_B\n');
  await assert.rejects(readSkill(candidate), /rescan/);
  const [fresh] = (await scanSkills(options(root))).skills;
  assert.equal(fresh.fingerprint, candidate.fingerprint);
  assert.notEqual(fresh.inspectionFingerprint, candidate.inspectionFingerprint);
  await assert.rejects(readSkill(fresh, { expectedFingerprint: candidate.inspectionFingerprint }), /rescan/);
  assert.equal(typeof await readSkill(fresh, { expectedFingerprint: fresh.inspectionFingerprint }), 'string');
});

test('inspection tolerates normalized line endings and requires fresh evidence for old catalogs', async t => {
  const root = await sandbox(t);
  const path = await skill(root, 'one', 'one', 'Review CLI behavior');
  const [candidate] = (await scanSkills(options(root))).skills;
  const content = await readSkill(candidate);
  await writeFile(path, '\uFEFF' + content.replace(/\r?\n/g, '\r\n'));
  assert.equal(await readSkill(candidate), '\uFEFF' + content.replace(/\r?\n/g, '\r\n'));
  const { inspectionFingerprint, ...legacy } = candidate;
  await assert.rejects(readSkill(legacy), /rescan/);
  await rm(path);
  await assert.rejects(readSkill(candidate), /missing.*rescan/);
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
