import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Provide the completed behavioral workspace path.');
const root = resolve(process.argv[2]);
if (process.argv[3] && process.argv[3] !== '--output-only') throw new Error('Unsupported verification option.');
async function load(path) { return import(pathToFileURL(join(root, path)).href); }
async function verifyBaseCases() {
  const { welcome } = await load('01-welcome/welcome.js');
  assert.equal(welcome('Ethan'), 'Welcome, Ethan!');
  console.log('PASS independent greeting contract');

  const { cache } = await load('02-cache/cache.js');
  const calls = [];
  const cached = cache({ read(tenant, id) { calls.push([tenant, id]); return id === 'missing' ? undefined : { tenant, id }; } });
  for (const [tenant, id] of [['north', '42'], ['south', '42'], ['a:b', 'c'], ['a', 'b:c']]) {
    const first = cached.read(tenant, id);
    assert.deepEqual(first, { tenant, id });
    assert.equal(cached.read(tenant, id), first);
  }
  assert.equal(calls.length, 4);
  for (const tenant of ['north', 'south']) {
    assert.equal(cached.read(tenant, 'missing'), undefined);
    assert.equal(cached.read(tenant, 'missing'), undefined);
  }
  assert.equal(calls.length, 6);
  console.log('PASS independent tenant isolation and repeated-read contracts');
}
if (process.argv[3] !== '--output-only') await verifyBaseCases();

const { run } = await load('03-output/cli.js');
const records = [{ id: 1, title: 'One' }, { id: '二', title: '"two"\nline', nested: { active: true } }];
const snapshot = JSON.stringify(records);
const originalText = records.map(item => item.id + ': ' + item.title).join('\n');
assert.equal(run([], records), originalText);
assert.equal(run(['--format', 'text'], records), originalText);
assert.deepEqual(JSON.parse(run(['--format', 'json'], records)), records);
assert.equal(run([], []), '');
assert.deepEqual(JSON.parse(run(['--format', 'json'], [])), []);
for (const args of [['--format'], ['--format', 'xml'], ['--mystery'], ['--format', 'json', '--mystery']]) {
  assert.throws(() => run(args, records));
}
assert.equal(JSON.stringify(records), snapshot);
console.log('PASS independent output compatibility and option contracts');
