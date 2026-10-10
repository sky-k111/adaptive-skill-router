import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Provide the investigation workspace to verify.');
const { resourceCache } = await import(pathToFileURL(join(resolve(process.argv[2]), 'cache.js')).href);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
// A bounded harness catches a never-started load; gates determine scheduling, not elapsed time.
function controlled() {
  const calls = [];
  const waiters = new Map();
  const cache = resourceCache((account, resource) => {
    const entry = { account, resource, ...deferred() };
    calls.push(entry);
    waiters.get(calls.length)?.resolve(entry);
    return entry.promise;
  });
  async function started(count) {
    if (calls.length >= count) return calls[count - 1];
    const gate = deferred();
    waiters.set(count, gate);
    return gate.promise;
  }
  return { cache, calls, started };
}
const check = (name, body) => test(name, { timeout: 3000 }, body);

await check('ordinary coalescing, successful cache and unrelated identities', async () => {
  const { cache, calls, started } = controlled();
  const first = cache.read('alpha', 'one');
  const shared = cache.read('alpha', 'one');
  const other = cache.read('beta', 'one');
  const a = await started(1), b = await started(2);
  a.resolve({ version: 'a' }); b.resolve({ version: 'b' });
  assert.deepEqual(await Promise.all([first, shared, other]), [{ version: 'a' }, { version: 'a' }, { version: 'b' }]);
  assert.deepEqual(await cache.read('alpha', 'one'), { version: 'a' });
  assert.equal(calls.length, 2);
});
await check('arbitrary identity strings do not alias', async () => {
  const calls = [];
  const cache = resourceCache((account, resource) => { calls.push([account, resource]); return [account, resource]; });
  const pairs = [['a/b', 'c'], ['a', 'b/c'], ['', '/'], ['/', ''], ['__proto__', 'x'], ['a', 'b\u0000c'], ['a\u0000b', 'c']];
  for (const pair of pairs) assert.deepEqual(await cache.read(...pair), pair);
  assert.equal(calls.length, pairs.length);
});
await check('synchronous and asynchronous failures both permit a new ordinary read', async () => {
  for (const synchronous of [true, false]) {
    let count = 0;
    const cache = resourceCache(() => {
      if (++count === 1) {
        if (synchronous) throw new Error('temporary');
        return Promise.reject(new Error('temporary'));
      }
      return undefined;
    });
    await assert.rejects(async () => cache.read('a', 'r'), /temporary/);
    assert.equal(await cache.read('a', 'r'), undefined);
    assert.equal(await cache.read('a', 'r'), undefined);
    assert.equal(count, 2, 'Even undefined successes must remain cached');
  }
});
await check('old completion cannot remove a newer pending refresh', async () => {
  const { cache, calls, started } = controlled();
  const old = cache.read('a', 'r');
  const older = await started(1);
  const fresh = cache.refresh('a', 'r');
  const newer = await started(2);
  older.resolve('old'); assert.equal(await old, 'old');
  const shared = cache.read('a', 'r');
  newer.resolve('new');
  assert.deepEqual(await Promise.all([fresh, shared]), ['new', 'new']);
  assert.equal(await cache.read('a', 'r'), 'new');
  assert.equal(calls.length, 2);
});
await check('out-of-order older success cannot overwrite a completed refresh', async () => {
  const { cache, started } = controlled();
  const old = cache.read('a', 'r'); const older = await started(1);
  const fresh = cache.refresh('a', 'r'); const newer = await started(2);
  newer.resolve('new'); assert.equal(await fresh, 'new');
  older.resolve('old'); assert.equal(await old, 'old');
  assert.equal(await cache.read('a', 'r'), 'new');
});
await check('obsolete rejection leaves current pending load intact', async () => {
  const { cache, calls, started } = controlled();
  const old = cache.read('a', 'r');
  const rejected = assert.rejects(old, /old failure/);
  const older = await started(1);
  const fresh = cache.refresh('a', 'r'); const newer = await started(2);
  older.reject(new Error('old failure')); await rejected;
  const shared = cache.read('a', 'r');
  newer.resolve('new');
  assert.deepEqual(await Promise.all([fresh, shared]), ['new', 'new']);
  assert.equal(calls.length, 2);
});
await check('multiple refreshes keep newest authority after its failure', async () => {
  const { cache, started, calls } = controlled();
  const first = cache.read('a', 'r'); const one = await started(1);
  const second = cache.refresh('a', 'r'); const two = await started(2);
  const third = cache.refresh('a', 'r');
  const thirdFailure = assert.rejects(third, /new failure/);
  const three = await started(3);
  three.reject(new Error('new failure')); await thirdFailure;
  two.resolve('second'); one.resolve('first');
  assert.deepEqual(await Promise.all([first, second]), ['first', 'second']);
  const retry = cache.read('a', 'r'); const four = await started(4);
  four.resolve('recovered'); assert.equal(await retry, 'recovered');
  assert.equal(await cache.read('a', 'r'), 'recovered');
  assert.equal(calls.length, 4);
});
