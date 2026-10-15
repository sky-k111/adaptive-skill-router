import test from 'node:test';
import assert from 'node:assert/strict';
import { scanSkills, discoverLocalSkills, searchRemoteSkills } from '../dist/index.js';
import { configureCliProxy } from '../skills/adaptive-workflow/scripts/search-skills.mjs';
import * as http from 'node:http';
import { sandbox, skill, put, options } from './helpers.mjs';

const row = (source = 'example/skills', slug = 'browser-tests', extra = {}) => ({
  id: `${source}/${slug}`, source, name: slug, installs: 120, ...extra
});
const response = skills => Response.json({ skills });

test('plain capability phrases retrieve hyphenated names ahead of a generic overlap', async t => {
  const root = await sandbox(t);
  await skill(root, 'frontend', 'frontend-design', 'Create intentional interfaces for the web');
  await skill(root, 'generic', 'guidelines', 'Design guidance');
  const matches = discoverLocalSkills('frontend design', await scanSkills(options(root)));
  assert.equal(matches[0].name, 'frontend-design');
  assert.deepEqual(matches[0].matchedTerms, ['frontend', 'design']);
  assert.equal(matches[1].name, 'guidelines');
});

test('local discovery separates retrievability from invocation eligibility and preserves collisions', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'browser-tests', 'Playwright browser testing');
  await skill(root, 'two', 'browser-tests', 'Playwright browser testing');
  const disabled = await skill(root, 'disabled', 'disabled-browser', 'Playwright browser testing');
  await put(root, 'home/.codex/config.toml', `[[skills.config]]\npath = ${JSON.stringify(disabled.replaceAll('\\', '/'))}\nenabled = false\n`);
  await skill(root, 'manual', 'manual-browser', 'Playwright browser testing');
  await put(root, 'manual/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  await skill(root, 'other', 'database', 'SQL performance');
  const catalog = await scanSkills(options(root));
  const matches = discoverLocalSkills('Playwright browser', catalog);
  assert.equal(matches.length, 4);
  assert.deepEqual(matches.map(s => s.eligibility), ['candidate', 'candidate', 'explicit-only', 'disabled']);
  assert.notEqual(matches[0].id, matches[1].id);
  assert.ok(matches.slice(0, 2).every(s => s.advisories.includes('name-collision-use-path')));
  assert.equal(discoverLocalSkills('不存在的能力', catalog).length, 0);
  assert.throws(() => discoverLocalSkills('browser', catalog, 0));
});

test('remote search encodes only capability keywords and returns source-bound, unverified metadata', async () => {
  let calls = 0;
  const result = await searchRemoteSkills({ query: '  browser  testing & $literal ', owner: 'Example', limit: 2 }, async (url, init) => {
    calls++;
    assert.equal(url.origin, 'https://skills.sh');
    assert.equal(url.searchParams.get('q'), 'browser testing & $literal');
    assert.equal(url.searchParams.get('owner'), 'example');
    assert.equal(url.searchParams.get('limit'), '2');
    assert.deepEqual(init.headers, { Accept: 'application/json' });
    assert.equal(init.redirect, 'manual');
    return response([row(), row('example/other', 'browser-tests')]);
  });
  assert.equal(calls, 1);
  assert.equal(result.candidates.length, 2);
  assert.notEqual(result.candidates[0].id, result.candidates[1].id);
  assert.equal(result.candidates[0].repositoryUrl, 'https://github.com/example/skills');
  assert.equal(result.candidates[0].url, 'https://skills.sh/example/skills/browser-tests');
  assert.equal(result.candidates[0].availability, 'remote-unverified');
  assert.deepEqual(result.selectedSkills, []);
  assert.ok(!('installCommand' in result.candidates[0]));
});

test('remote reranking uses query coverage rather than popularity and exposes explicit exclusions', async () => {
  const rows = [row('cap-go/capgo-skills', 'capacitor-ci-cd', { installs: 999999 }), row('lirantal/nodejs-cli-apps-best-practices', 'nodejs-cli-best-practices', { installs: 1 }), row('ccusage/ccusage', 'testing')];
  const result = await searchRemoteSkills({ query: 'node cli testing' }, async () => response(rows));
  assert.equal(result.candidates[0].source, 'lirantal/nodejs-cli-apps-best-practices');
  assert.equal(result.candidates[0].providerRank, 2);
  assert.deepEqual(result.candidates[0].relevance.matchedTerms, ['node', 'cli']);
  const filtered = await searchRemoteSkills({ query: 'node cli testing', requiredTerms: ['cli'], excludedTerms: ['capacitor'] }, async url => {
    assert.ok(!String(url).includes('exclude'));
    return response(rows);
  });
  assert.equal(filtered.candidates.length, 1);
  assert.equal(filtered.filteredCandidates.length, 2);
  assert.ok(filtered.filteredCandidates.find(s => s.slug === 'capacitor-ci-cd').relevance.matchedExcludedTerms.includes('capacitor'));
  assert.deepEqual(filtered.selectedSkills, []);
});

test('local constraints preserve eligibility and do not treat a lexical miss as semantic rejection', async t => {
  const root = await sandbox(t);
  await skill(root, 'cli', 'node-cli', 'Test Node.js command behavior');
  await skill(root, 'mobile', 'mobile-cli', 'Test Capacitor delivery');
  const catalog = await scanSkills(options(root));
  const matches = discoverLocalSkills('node cli testing', catalog, 5, { excludedTerms: ['capacitor'] });
  assert.deepEqual(matches.map(s => s.name), ['node-cli']);
  assert.equal(matches[0].relevance.queryCoverage, 2 / 3);
  assert.throws(() => discoverLocalSkills('node', catalog, 5, { requiredTerms: ['\nprivate'] }), /Constraints/);
});

test('malicious, inconsistent, duplicate and out-of-owner rows do not become remote candidates', async () => {
  const result = await searchRemoteSkills({ query: 'browser', owner: 'example', limit: 2 }, async () => response([
    null, row('example/skills', 'browser-tests', { id: 'attacker/other/browser-tests' }),
    row('example/skills', '../escape'), row('example/skills', 'terminal', { name: '\u001b[2J' }),
    row('attacker/other'), row(), row(), row('example/second', 'another', { installs: -10 }),
    row('example/third', 'third')
  ]));
  assert.deepEqual(result.candidates.map(s => s.source), ['example/skills', 'example/second']);
  assert.equal(result.candidates[1].installs, null);
  assert.equal(result.diagnostics[0].code, 'registry-entries-excluded');
});

test('invalid inputs are rejected before any transport request', async () => {
  let calls = 0;
  const transport = async () => { calls++; return response([]); };
  for (const input of [
    { query: '' }, { query: 'a' }, { query: 'x'.repeat(161) }, { query: 'browser\nprivate' },
    { query: 'browser', owner: '../escape' }, { query: 'browser', owner: '' },
    { query: 'browser', limit: 0 }, { query: 'browser', limit: 21 },
    { query: 'browser', timeoutMs: 99 }, { query: 'browser', timeoutMs: Infinity }
  ]) await assert.rejects(searchRemoteSkills(input, transport));
  assert.equal(calls, 0);
});

test('service errors, schema drift and invalid bodies remain failures rather than empty results', async () => {
  for (const [factory, expected] of [
    [() => new Response('PRIVATE_RESPONSE', { status: 429 }), /HTTP 429/],
    [() => Response.json({ data: [] }), /schema changed/],
    [() => new Response('<html>PRIVATE_RESPONSE</html>'), /invalid UTF-8 or JSON/],
    [() => new Response(new Uint8Array([255, 254])), /invalid UTF-8 or JSON/]
  ]) {
    let calls = 0;
    await assert.rejects(searchRemoteSkills({ query: 'browser' }, async () => { calls++; return factory(); }), error => {
      assert.match(error.message, expected);
      assert.doesNotMatch(error.message, /PRIVATE_RESPONSE/);
      return true;
    });
    assert.equal(calls, 1);
  }
  const empty = await searchRemoteSkills({ query: 'browser' }, async () => response([]));
  assert.deepEqual(empty.candidates, []);
  assert.deepEqual(empty.diagnostics, []);
});

test('redirects are bounded and cannot send search keywords to another origin', async () => {
  let calls = 0;
  const result = await searchRemoteSkills({ query: 'browser' }, async url => {
    calls++;
    return url.hostname === 'skills.sh' ? new Response(null, { status: 307, headers: { location: `https://www.skills.sh${url.pathname}${url.search}` } }) : response([row()]);
  });
  assert.equal(calls, 2);
  assert.equal(result.candidates.length, 1);
  for (const location of ['http://skills.sh/api/search', 'https://attacker.test/search', 'https://skills.sh:8443/api/search', 'https://user@skills.sh/search']) {
    calls = 0;
    await assert.rejects(searchRemoteSkills({ query: 'browser' }, async () => { calls++; return new Response(null, { status: 302, headers: { location } }); }), /allowed HTTPS origin/);
    assert.equal(calls, 1);
  }
  calls = 0;
  await assert.rejects(searchRemoteSkills({ query: 'browser' }, async () => { calls++; return new Response(null, { status: 302, headers: { location: '/loop' } }); }), /redirect could not be resolved/);
  assert.equal(calls, 3);
});

test('response sizes are bounded even without a content-length header', async () => {
  for (const headers of [{}, { 'content-length': String(512 * 1024 + 1) }]) {
    await assert.rejects(searchRemoteSkills({ query: 'browser' }, async () => new Response('x'.repeat(512 * 1024 + 1), { headers })), /size limit/);
  }
});

test('connection retries are bounded and observable while the total timeout is retained', async () => {
  let calls = 0;
  await assert.rejects(searchRemoteSkills({ query: 'browser' }, async () => { calls++; throw new TypeError('PRIVATE_NETWORK_DETAILS'); }), /network request failed/);
  assert.equal(calls, 2);
  calls = 0;
  const recovered = await searchRemoteSkills({ query: 'browser' }, async () => {
    if (++calls === 1) throw new TypeError('connection reset');
    return response([row()]);
  });
  assert.equal(calls, 2);
  assert.equal(recovered.candidates.length, 1);
  assert.equal(recovered.diagnostics[0].code, 'registry-connection-retried');
  await assert.rejects(searchRemoteSkills({ query: 'browser', timeoutMs: 100 }, async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  })), /timed out/);
  await assert.rejects(searchRemoteSkills({ query: 'browser', timeoutMs: 100 }, async (_url, { signal }) => new Response(new ReadableStream({ start(controller) {
    signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
  } }))), /timed out/);
});

test('explicit proxy configuration rejects unsafe or credential-bearing URLs without leaking them', () => {
  for (const proxy of ['', 'socks5://proxy:1', 'http://user:PRIVATE@proxy:1', 'http://proxy/path', 'http://proxy/?token=PRIVATE', 'http://proxy/#PRIVATE', '\nhttp://proxy:1']) {
    assert.throws(() => configureCliProxy(proxy), error => { assert.doesNotMatch(error.message, /PRIVATE/); return true; });
  }
  assert.equal(typeof configureCliProxy(), 'function');
  if (typeof http.setGlobalProxyFromEnv === 'function') {
    const original = http.default.globalAgent;
    const restore = configureCliProxy('http://127.0.0.1:1');
    try { assert.notEqual(http.default.globalAgent, original); }
    finally { restore(); }
    assert.equal(http.default.globalAgent, original);
  } else assert.throws(() => configureCliProxy('http://127.0.0.1:1'), /Node.js 24.14/);
});
