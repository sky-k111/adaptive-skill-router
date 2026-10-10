import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, symlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { planIntegration, writeIntegration } from '../dist/index.js';
import { sandbox, put } from './helpers.mjs';

test('preview does not write and integration preserves instructions with idempotent updates', async t => {
  const root = await sandbox(t);
  const original = '# Project\r\nDo not deploy.\r\n';
  const file = await put(root, 'AGENTS.md', original);
  const plans = await planIntegration(root);
  assert.equal(await readFile(file, 'utf8'), original);
  const backups = await writeIntegration(root, plans);
  assert.equal(backups.length, 1);
  assert.equal(await readFile(backups[0], 'utf8'), original);
  assert.ok((await readFile(file, 'utf8')).startsWith(original));
  const generated = join(root, '.agents/skills/adaptive-skill-router/SKILL.md');
  const entry = await readFile(generated, 'utf8');
  const links = [...entry.matchAll(/\]\((references\/[^)]+)\)/g)].map(match => match[1]);
  assert.ok(links.length > 0);
  for (const link of links) assert.ok((await readFile(join(generated, '..', link), 'utf8')).trim());
  const second = await planIntegration(root);
  assert.ok(second.every(p => !p.changed));
  assert.deepEqual(await writeIntegration(root, second), []);
});

test('an unrelated existing reference stops integration before any instruction is written', async t => {
  const root = await sandbox(t);
  const original = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
  const reference = await put(root, '.agents/skills/adaptive-skill-router/references/routing.md', '# Personal reference\n');
  await assert.rejects(planIntegration(root), /unrelated reference/);
  assert.equal(await readFile(original, 'utf8'), '# Preserve project instructions\n');
  assert.equal(await readFile(reference, 'utf8'), '# Personal reference\n');
});

test('a reference changed after preview rejects the entire plan before mutation', async t => {
  const root = await sandbox(t);
  const original = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
  const plans = await planIntegration(root);
  const reference = await put(root, '.agents/skills/adaptive-skill-router/references/routing.md', '# Concurrent reference\n');
  await assert.rejects(writeIntegration(root, plans), /changed after preview/);
  assert.equal(await readFile(original, 'utf8'), '# Preserve project instructions\n');
  assert.equal(await readFile(reference, 'utf8'), '# Concurrent reference\n');
  await assert.rejects(readFile(join(root, '.agents/skills/adaptive-skill-router/SKILL.md')), { code: 'ENOENT' });
});
test('malformed integration markers stop before mutation', async t => {
  const root = await sandbox(t);
  await put(root, 'AGENTS.md', '<!-- adaptive-skill-router:start -->\nMissing end');
  await assert.rejects(planIntegration(root), /malformed/);
});
test('refuses redirected instruction files', async t => {
  const root = await sandbox(t);
  const target = await put(root, 'outside.txt', 'preserve');
  try { await symlink(target, join(root, 'AGENTS.md')); }
  catch (error) { if (error.code === 'EPERM') { t.skip('File symlinks require Windows privileges.'); return; } throw error; }
  await assert.rejects(planIntegration(root), /symlink/);
});
test('refuses redirected skill directories', async t => {
  const root = await sandbox(t);
  const instructions = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
  await mkdir(join(root, 'external'), { recursive: true });
  await symlink(join(root, 'external'), join(root, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  const plans = await planIntegration(root);
  await assert.rejects(writeIntegration(root, plans), /redirected/);
  assert.equal(await readFile(instructions, 'utf8'), '# Preserve project instructions\n');
});

test('rejects a stale preview before changing any file', async t => {
  const root = await sandbox(t);
  const file = await put(root, 'AGENTS.md', '# Original\n');
  const plans = await planIntegration(root);
  await put(root, 'AGENTS.md', '# Concurrent change\n');
  await assert.rejects(writeIntegration(root, plans), /changed after preview/);
  assert.equal(await readFile(file, 'utf8'), '# Concurrent change\n');
  await assert.rejects(readFile(join(root, '.agents/skills/adaptive-skill-router/SKILL.md')), { code: 'ENOENT' });
});
