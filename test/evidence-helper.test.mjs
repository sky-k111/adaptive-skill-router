import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { capture, check, runCli } from '../skills/adaptive-workflow/scripts/check-evidence.mjs';
import { sandbox, put } from './helpers.mjs';

const cli = fileURLToPath(new URL('../skills/adaptive-workflow/scripts/check-evidence.mjs', import.meta.url));
async function project(t) {
  const base = await sandbox(t);
  const root = join(base, 'project');
  await mkdir(root);
  await put(root, 'src/file.txt', 'original');
  return { base, root };
}

test('capture selects only explicit files and check distinguishes file state from verification', async t => {
  const { root } = await project(t);
  await put(root, 'unselected/private.txt', 'not recorded');
  const result = await capture({ root, output: 'state.json', files: ['src/file.txt'] });
  assert.equal(result.selectedFiles, 1);
  const record = JSON.parse(await readFile(result.record, 'utf8'));
  assert.deepEqual(record.files.map(file => file.path), ['src/file.txt']);
  assert.match(record.files[0].sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isFinite(Date.parse(record.createdAt)));
  assert.deepEqual((await check({ root, record: 'state.json' })).files, [{ path: 'src/file.txt', status: 'unchanged' }]);
  assert.match(result.meaning, /no verification/);
  await assert.rejects(capture({ root, output: 'state.json', files: ['src/file.txt'] }), { code: 'EEXIST' });
});

test('check marks modified and missing files with nonzero CLI status', async t => {
  const { root } = await project(t);
  await put(root, 'remove.txt', 'remove later');
  await capture({ root, output: 'state.json', files: ['src/file.txt', 'remove.txt'] });
  await put(root, 'src/file.txt', 'modified');
  await rm(join(root, 'remove.txt'));
  const expected = [{ path: 'src/file.txt', status: 'changed' }, { path: 'remove.txt', status: 'missing' }];
  assert.deepEqual((await check({ root, record: 'state.json' })).files, expected);
  const child = spawnSync(process.execPath, [cli, 'check', '--root', root, '--record', 'state.json'], { encoding: 'utf8' });
  assert.equal(child.status, 1, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout).files, expected);
});

test('records bind to canonical project root and reject malformed or forged paths', async t => {
  const { base, root } = await project(t);
  await capture({ root, output: 'state.json', files: ['src/file.txt'] });
  const original = JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));
  const other = join(base, 'other');
  await mkdir(other);
  await writeFile(join(other, 'state.json'), JSON.stringify(original));
  await assert.rejects(check({ root: other, record: 'state.json' }), /root mismatch/);
  for (const invalid of ['{broken', JSON.stringify({ ...original, files: [{ ...original.files[0], path: '../outside.txt' }] }), JSON.stringify({ ...original, files: [{ ...original.files[0], sha256: 'invalid' }] }), JSON.stringify({ ...original, files: [...original.files, original.files[0]] })]) {
    await writeFile(join(root, 'state.json'), invalid);
    await assert.rejects(check({ root, record: 'state.json' }));
  }
});

test('capture rejects absent selections, directories, duplicates and paths outside the root', async t => {
  const { base, root } = await project(t);
  await put(base, 'outside.txt', 'private');
  for (const files of [[], ['../outside.txt'], [join(base, 'outside.txt')], ['src'], ['src/file.txt', 'src/file.txt'], ['src\\file.txt'], ['src/../src/file.txt']]) {
    await assert.rejects(capture({ root, output: 'state.json', files }));
  }
  await assert.rejects(capture({ root, output: '../outside-state.json', files: ['src/file.txt'] }), /inside/);
  await assert.rejects(check({ root, record: '../outside.txt' }), /inside/);
});

test('parent-directory links cannot redirect selected files or record IO outside the root', async t => {
  const { base, root } = await project(t);
  const outside = join(base, 'outside');
  await mkdir(outside);
  await put(outside, 'private.txt', 'private');
  await symlink(outside, join(root, 'external'), 'junction');
  await assert.rejects(capture({ root, output: 'state.json', files: ['external/private.txt'] }), /outside/);
  await assert.rejects(capture({ root, output: 'external/state.json', files: ['src/file.txt'] }), /outside/);
  await assert.rejects(check({ root, record: 'external/private.txt' }), /outside/);
  await capture({ root, output: 'state.json', files: ['src/file.txt'] });
  await rm(join(root, 'src'), { recursive: true });
  await symlink(outside, join(root, 'src'), 'junction');
  await assert.rejects(check({ root, record: 'state.json' }), /outside/);
});

test('file links outside the root, including dangling links, are rejected', async t => {
  const { base, root } = await project(t);
  const outside = await put(base, 'outside.txt', 'private');
  try { await symlink(outside, join(root, 'linked.txt'), 'file'); }
  catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('This host does not permit creating file symlinks.'); return; }
    throw error;
  }
  await assert.rejects(capture({ root, output: 'state.json', files: ['linked.txt'] }), /outside/);
  await rm(outside);
  await assert.rejects(capture({ root, output: 'state.json', files: ['linked.txt'] }), /outside/);
  await assert.rejects(capture({ root, output: 'linked.txt', files: ['src/file.txt'] }), { code: 'EEXIST' });
  await assert.rejects(readFile(outside), { code: 'ENOENT' });
});

test('same-content directory redirection inside the root is changed, not unchanged', async t => {
  const { root } = await project(t);
  await capture({ root, output: 'state.json', files: ['src/file.txt'] });
  await put(root, 'other/file.txt', 'original');
  await rm(join(root, 'src'), { recursive: true });
  await symlink(join(root, 'other'), join(root, 'src'), 'junction');
  assert.deepEqual((await check({ root, record: 'state.json' })).files, [{ path: 'src/file.txt', status: 'changed' }]);
});

test('canonical project aliases work for selected links and absolute record paths', async t => {
  const { base, root } = await project(t);
  const alias = join(base, 'project-alias');
  await symlink(root, alias, 'junction');
  await symlink(join(alias, 'src'), join(root, 'linked'), 'junction');
  const record = join(alias, 'state.json');
  await capture({ root: alias, output: record, files: ['linked/file.txt'] });
  assert.deepEqual((await check({ root, record })).files, [{ path: 'linked/file.txt', status: 'unchanged' }]);
  await rm(join(root, 'src/file.txt'));
  assert.deepEqual((await check({ root: alias, record })).files, [{ path: 'linked/file.txt', status: 'missing' }]);
  await rm(join(root, 'linked'));
  // A dangling internal target through the alias is missing, rather than an escape.
  await symlink(join(alias, 'absent'), join(root, 'linked'), 'junction');
  assert.deepEqual((await check({ root, record })).files, [{ path: 'linked/file.txt', status: 'missing' }]);
});

test('a record directory redirected outside the root is rejected before reading the record', async t => {
  const { base, root } = await project(t);
  await mkdir(join(root, 'records'));
  await capture({ root, output: 'records/state.json', files: ['src/file.txt'] });
  const outside = join(base, 'outside');
  await mkdir(outside);
  await writeFile(join(outside, 'state.json'), await readFile(join(root, 'records/state.json')));
  await rm(join(root, 'records'), { recursive: true });
  await symlink(outside, join(root, 'records'), 'junction');
  await assert.rejects(check({ root, record: 'records/state.json' }), /outside/);
});

test('oversized records are rejected and unknown metadata does not authorize execution', async t => {
  const { root } = await project(t);
  await capture({ root, output: 'state.json', files: ['src/file.txt'] });
  const record = JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));
  record.commands = ['create execution-marker.txt'];
  await writeFile(join(root, 'state.json'), JSON.stringify(record));
  assert.equal((await check({ root, record: 'state.json' })).files[0].status, 'unchanged');
  await assert.rejects(readFile(join(root, 'execution-marker.txt')), { code: 'ENOENT' });
  await writeFile(join(root, 'state.json'), ' '.repeat(1024 * 1024 + 1));
  await assert.rejects(check({ root, record: 'state.json' }), /size limit/);
});

test('CLI rejects invalid inputs with error status and succeeds for unchanged state', async t => {
  const { root } = await project(t);
  for (const args of [[], ['capture', '--root'], ['capture', '--root', root, '--unknown', 'x'], ['check', '--root', root, '--root', root], ['check', '--root', root, 'src/file.txt']]) await assert.rejects(runCli(args));
  const captureChild = spawnSync(process.execPath, [cli, 'capture', '--root', root, '--output', 'state.json', 'src/file.txt'], { encoding: 'utf8' });
  assert.equal(captureChild.status, 0, captureChild.stderr);
  const checkChild = spawnSync(process.execPath, [cli, 'check', '--root', root, '--record', 'state.json'], { encoding: 'utf8' });
  assert.equal(checkChild.status, 0, checkChild.stderr);
  const invalidChild = spawnSync(process.execPath, [cli, 'check', '--root', root, '--record', 'missing.json'], { encoding: 'utf8' });
  assert.equal(invalidChild.status, 2);
  assert.equal(typeof JSON.parse(invalidChild.stderr).error, 'string');
});
