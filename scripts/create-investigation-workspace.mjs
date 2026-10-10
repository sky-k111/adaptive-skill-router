import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { planIntegration, writeIntegration } from '../dist/index.js';

if (!process.argv[2]) throw new Error('Provide a fresh, explicit experiment directory.');
const target = resolve(process.argv[2]);
try { await access(target); throw new Error('Choose a fresh workspace; existing files will not be replaced.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(target, { recursive: true });
async function put(path, content) {
  const file = join(target, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, { flag: 'wx' });
}
await put('AGENTS.md', '# Investigation experiment\n\nWork only in this sandbox. Keep the router source and global configuration read-only. No publishing, deployments, installation or subagents. Use Node built-ins and evidence-based methods. The incident note is an observation, not a proven cause.\n');
await writeIntegration(target, await planIntegration(target));
await put('package.json', '{"type":"module","scripts":{"test":"node --test cache.test.js"}}\n');
await put('cache.js', `export function resourceCache(load) {
  const saved = new Map();
  const pending = new Map();
  const address = (account, resource) => account + '/' + resource;
  function read(account, resource) {
    const key = address(account, resource);
    if (saved.has(key)) return Promise.resolve(saved.get(key));
    if (pending.has(key)) return pending.get(key);
    const request = Promise.resolve().then(() => load(account, resource)).then(value => {
      saved.set(key, value);
      pending.delete(key);
      return value;
    });
    pending.set(key, request);
    return request;
  }
  function refresh(account, resource) {
    const key = address(account, resource);
    saved.delete(key);
    pending.delete(key);
    return read(account, resource);
  }
  return { read, refresh };
}
`);
await put('cache.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import { resourceCache } from './cache.js';
test('successful reads are cached and an ordinary refresh loads again', async () => {
  let loads = 0;
  const cache = resourceCache(async () => ++loads);
  assert.equal(await cache.read('account', 'report'), 1);
  assert.equal(await cache.read('account', 'report'), 1);
  assert.equal(await cache.refresh('account', 'report'), 2);
  assert.equal(await cache.read('account', 'report'), 2);
});
`);
await put('INCIDENT.md', '# Incident observations\n\nOccasionally a report reverts after a refresh. During another incident, retries kept receiving a previous temporary failure even after the backend recovered. The latest log sample mentions a gateway timeout; an operator suspects the gateway retry count. The repository has no gateway implementation. Sequential smoke checks are green. These are reports to investigate, not established explanations.\n');
await put('TASK.md', `# Request

Diagnose and repair resourceCache in cache.js. Preserve the public read(account, resource) / refresh(account, resource) API. Both account and resource are arbitrary strings.

Repeated successful reads stay cached; simultaneous ordinary reads for the same pair share a load. Different pairs remain isolated. A failed load must be retryable. Refresh starts a new authoritative load, even if an older load is unfinished. Existing callers of an older load may still receive its own outcome, but completion of that load must not replace refreshed state or disturb the current pending request. After the newest refresh fails, a subsequent read may retry; an older success must not silently become current. Loader return values and failures may be synchronous or asynchronous.

Investigate relevant code and existing checks first. Use useful verification of interleavings without sleep-based scheduling. Record actual observations, hypotheses that changed (if any), methods and Skill files actually read, verification, unverified behavior and extra artifacts. Stop after acceptance; no framework or gateway changes are requested.
`);
console.log(target);
