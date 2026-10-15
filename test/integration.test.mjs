import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, symlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planIntegration, writeIntegration } from '../dist/index.js';
import { sandbox, put } from './helpers.mjs';

const methodResources = [
  'references/investigation.md',
  'references/capability-selection.md',
  'references/continuity.md',
  'scripts/check-evidence.mjs',
  'scripts/search-skills.mjs',
  'scripts/search-skills.d.mts',
  'scripts/collect-source.mjs',
  'scripts/collect-source.d.mts'
];
const projectSkill = '.agents/skills/adaptive-skill-router';

async function assertLocalLinksReadable(file) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    if (match[1].includes('://') || match[1].startsWith('#')) continue;
    assert.ok((await readFile(join(file, '..', match[1].split('#')[0]), 'utf8')).trim());
  }
}

test('distributed project resources match canonical methods and their local links resolve', async () => {
  const sourceRoot = fileURLToPath(new URL('../skills/adaptive-skill-router/', import.meta.url));
  await assertLocalLinksReadable(join(sourceRoot, 'SKILL.md'));
  for (const resource of methodResources) {
    const canonical = await readFile(new URL(`../skills/adaptive-workflow/${resource}`, import.meta.url), 'utf8');
    const distributed = join(sourceRoot, resource);
    assert.equal(await readFile(distributed, 'utf8'), canonical);
    if (resource.endsWith('.md')) await assertLocalLinksReadable(distributed);
  }
});

test('preview does not write and integration preserves instructions with idempotent updates', async t => {
  const root = await sandbox(t);
  const original = '# Project\r\nDo not deploy.\r\n';
  const file = await put(root, 'AGENTS.md', original);
  const originals = await Promise.all(methodResources.map(resource => readFile(new URL(`../skills/adaptive-workflow/${resource}`, import.meta.url), 'utf8')));
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
  for (let i = 0; i < methodResources.length; i++) {
    const installed = join(root, projectSkill, methodResources[i]);
    assert.equal(await readFile(installed, 'utf8'), originals[i]);
    assert.equal(await readFile(new URL(`../skills/adaptive-workflow/${methodResources[i]}`, import.meta.url), 'utf8'), originals[i]);
    if (methodResources[i].endsWith('.md')) await assertLocalLinksReadable(installed);
  }
  const second = await planIntegration(root);
  assert.ok(second.every(p => !p.changed));
  assert.deepEqual(await writeIntegration(root, second), []);
});

test('unrelated method resources stop the complete integration before writing', async t => {
  for (const resource of methodResources) await t.test(resource, async t => {
    const root = await sandbox(t);
    const instructions = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
    const unrelated = await put(root, `${projectSkill}/${resource}`, 'Unrelated personal content\n');
    await assert.rejects(planIntegration(root), /unrelated (reference|script)/);
    assert.equal(await readFile(instructions, 'utf8'), '# Preserve project instructions\n');
    assert.equal(await readFile(unrelated, 'utf8'), 'Unrelated personal content\n');
    await assert.rejects(readFile(join(root, projectSkill, 'SKILL.md')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(root, projectSkill, 'references/routing.md')), { code: 'ENOENT' });
  });
});

test('method resources changed after preview reject the complete plan before writing', async t => {
  for (const resource of methodResources) await t.test(resource, async t => {
    const root = await sandbox(t);
    const instructions = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
    const plans = await planIntegration(root);
    const concurrent = await put(root, `${projectSkill}/${resource}`, 'Concurrent personal content\n');
    await assert.rejects(writeIntegration(root, plans), /changed after preview/);
    assert.equal(await readFile(instructions, 'utf8'), '# Preserve project instructions\n');
    assert.equal(await readFile(concurrent, 'utf8'), 'Concurrent personal content\n');
    await assert.rejects(readFile(join(root, projectSkill, 'SKILL.md')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(root, projectSkill, 'references/routing.md')), { code: 'ENOENT' });
  });
});

test('updating managed methods backs up prior content and preserves the canonical sources', async t => {
  const root = await sandbox(t);
  await writeIntegration(root, await planIntegration(root));
  const oldContents = [];
  for (const resource of methodResources) {
    const original = await readFile(join(root, projectSkill, resource), 'utf8');
    const marker = original.split('\n').slice(0, resource.endsWith('.mjs') ? 2 : 1).join('\n');
    const old = `${marker}\nPrevious managed content\n`;
    oldContents.push(old);
    await put(root, `${projectSkill}/${resource}`, old);
  }
  const plans = await planIntegration(root);
  assert.equal(plans.filter(plan => plan.changed).length, methodResources.length);
  const backups = await writeIntegration(root, plans);
  assert.deepEqual((await Promise.all(backups.map(path => readFile(path, 'utf8')))).sort(), oldContents.sort());
  for (const resource of methodResources) {
    assert.equal(await readFile(join(root, projectSkill, resource), 'utf8'), await readFile(new URL(`../skills/adaptive-workflow/${resource}`, import.meta.url), 'utf8'));
  }
  assert.ok((await planIntegration(root)).every(plan => !plan.changed));
});

test('a changed method invalidates an otherwise idempotent preview', async t => {
  const root = await sandbox(t);
  await writeIntegration(root, await planIntegration(root));
  const plans = await planIntegration(root);
  assert.ok(plans.every(plan => !plan.changed));
  const file = await put(root, `${projectSkill}/references/continuity.md`, 'Concurrent personal content\n');
  await assert.rejects(writeIntegration(root, plans), /changed after preview/);
  assert.equal(await readFile(file, 'utf8'), 'Concurrent personal content\n');
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

test('refuses redirected method resource directories before writing instructions', async t => {
  for (const directory of ['references', 'scripts']) await t.test(directory, async t => {
    const root = await sandbox(t);
    const instructions = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
    const redirected = join(root, 'external');
    await mkdir(redirected, { recursive: true });
    await mkdir(join(root, projectSkill), { recursive: true });
    await symlink(redirected, join(root, projectSkill, directory), process.platform === 'win32' ? 'junction' : 'dir');
    const plans = await planIntegration(root);
    await assert.rejects(writeIntegration(root, plans), /redirected/);
    assert.equal(await readFile(instructions, 'utf8'), '# Preserve project instructions\n');
    await assert.rejects(readFile(join(root, projectSkill, 'SKILL.md')), { code: 'ENOENT' });
  });
});

test('an out-of-project resource rejects the complete plan before any write', async t => {
  const root = await sandbox(t);
  const outside = await sandbox(t);
  const instructions = await put(root, 'AGENTS.md', '# Preserve project instructions\n');
  const protectedFile = await put(outside, 'reference.md', 'Preserve external content\n');
  const plans = await planIntegration(root);
  plans.push({ path: protectedFile, content: 'Replace external content\n', previousContent: 'Preserve external content\n', changed: true });
  await assert.rejects(writeIntegration(root, plans), /outside the project/);
  assert.equal(await readFile(instructions, 'utf8'), '# Preserve project instructions\n');
  assert.equal(await readFile(protectedFile, 'utf8'), 'Preserve external content\n');
  await assert.rejects(readFile(join(root, projectSkill, 'SKILL.md')), { code: 'ENOENT' });
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
