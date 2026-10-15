import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { collectSkillSource } from '../skills/adaptive-workflow/scripts/collect-source.mjs';

const commit = 'a'.repeat(40), tree = 'b'.repeat(40);
function repository(overrides = {}, behavior = {}) {
  const contents = {
    'skills/review/SKILL.md': '---\nname: review\ndescription: Review a Node CLI\n---\nRead [guide](references/guide.md). Inspect `scripts/check.mjs`.\n',
    'skills/review/references/guide.md': 'Read [details](details.md).',
    'skills/review/references/details.md': 'Evidence matters.',
    'skills/review/scripts/check.mjs': 'globalThis.SOURCE_MUST_NOT_EXECUTE = true;\n',
    'skills/review/agents/openai.yaml': 'dependencies:\n  tools:\n    - value: required-tool\n',
    LICENSE: 'Example license; host must assess terms.', ...overrides
  };
  const blobs = new Map(), entries = [];
  for (const [path, text] of Object.entries(contents)) {
    if (text === null) continue;
    const bytes = Buffer.from(text);
    const sha = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
    entries.push({ path, sha, type: 'blob', mode: behavior.symlink === path ? '120000' : '100644', size: bytes.length });
    blobs.set(sha, { sha, encoding: 'base64', size: bytes.length, content: bytes.toString('base64') });
  }
  const calls = [];
  const transport = async (url, init) => {
    calls.push(String(url));
    assert.equal(new URL(url).origin, 'https://api.github.com');
    assert.equal(init.redirect, 'manual');
    assert.ok(!('Authorization' in init.headers));
    if (String(url).includes('/commits/')) return Response.json({ sha: commit, commit: { tree: { sha: tree } } });
    if (String(url).includes('/git/trees/')) return Response.json({ sha: tree, truncated: !!behavior.truncated, tree: entries });
    const id = String(url).split('/').at(-1);
    if (behavior.failBlob === id) return new Response('PRIVATE_REMOTE_ERROR', { status: 503 });
    const blob = blobs.get(id);
    if (!blob) throw Error('Unexpected blob request');
    return Response.json(behavior.corrupt ? { ...blob, content: Buffer.from('corrupt').toString('base64') } : blob);
  };
  return { calls, contents, entries, transport };
}
const options = { source: 'example/library', skill: 'review' };

test('collects one pinned source with licenses, invocation metadata and linked scripts as data', async () => {
  const fixture = repository();
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'complete');
  assert.equal(result.commit, commit);
  assert.equal(result.reviewStatus, 'not-reviewed');
  assert.deepEqual(result.selectedSkills, []);
  assert.equal(result.files.length, 6);
  assert.ok(result.files.every(file => file.url.includes(`/blob/${commit}/`) && /^[a-f0-9]{64}$/.test(file.sha256)));
  assert.ok(result.files.some(file => file.role === 'invocation-metadata' && file.content.includes('required-tool')));
  assert.ok(result.files.some(file => file.role === 'license'));
  assert.equal(globalThis.SOURCE_MUST_NOT_EXECUTE, undefined);
  assert.ok(fixture.calls.slice(1).every(url => !url.includes('/HEAD')));
});

test('returned Unicode text preserves a UTF-8 BOM so content hashes remain reproducible', async () => {
  const content = '\uFEFF---\nname: review\ndescription: 检查 CLI\n---\n正文\n';
  const result = await collectSkillSource(options, repository({ 'skills/review/SKILL.md': content }).transport);
  const entry = result.files.find(file => file.role === 'instructions');
  assert.equal(entry.content, content);
  assert.equal(entry.sha256, createHash('sha256').update(entry.content).digest('hex'));
});

test('incomplete references and missing licenses are explicit, not successful source review', async () => {
  const fixture = repository({ LICENSE: null, 'skills/review/references/details.md': null });
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'incomplete');
  assert.ok(result.unresolved.some(item => item.reason === 'license-not-found'));
  assert.ok(result.unresolved.some(item => item.path.endsWith('details.md') && item.reason === 'not-found'));
  assert.equal(result.reviewStatus, 'not-reviewed');
});

test('shared references pending at the depth boundary are collected once without false gaps', async () => {
  const fixture = repository({
    'skills/review/SKILL.md': '[first](references/first.md) [second](references/second.md)',
    'skills/review/references/first.md': '[left](left.md)',
    'skills/review/references/second.md': '[right](right.md)',
    'skills/review/references/left.md': '[shared](right.md)',
    'skills/review/references/right.md': '[cycle](left.md)'
  });
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.unresolved, []);
  for (const name of ['left.md', 'right.md']) {
    const path = `skills/review/references/${name}`;
    const entry = fixture.entries.find(file => file.path === path);
    assert.equal(result.files.filter(file => file.path === path).length, 1);
    assert.equal(fixture.calls.filter(url => url.endsWith(`/git/blobs/${entry.sha}`)).length, 1);
  }
});

test('an unscheduled reference beyond the depth boundary remains an explicit gap', async () => {
  const fixture = repository({
    'skills/review/references/details.md': '[deeper](deeper.md)',
    'skills/review/references/deeper.md': 'Outside the automatic reference depth.'
  });
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'incomplete');
  assert.ok(result.unresolved.some(item => item.path.endsWith('deeper.md') && item.reason === 'reference-depth-limit'));
  assert.ok(!result.files.some(file => file.path.endsWith('deeper.md')));
});

test('rejected traversal and ambiguous manifests never become executable source', async () => {
  let calls = 0;
  for (const change of [{ source: 'https://attacker/x' }, { path: '../SKILL.md', skill: undefined }, { include: ['x/%2e%2e/secret'] }, { ref: 'main?secret=1' }]) {
    await assert.rejects(collectSkillSource({ ...options, ...change }, async () => { calls++; }));
  }
  assert.equal(calls, 0);
  const fixture = repository({ 'other/review/SKILL.md': 'A second skill.' });
  await assert.rejects(collectSkillSource(options, fixture.transport), /2 manifests/);
  const exact = await collectSkillSource({ source: options.source, path: 'skills/review/SKILL.md' }, fixture.transport);
  assert.equal(exact.manifest, 'skills/review/SKILL.md');
});

test('truncated trees, identity drift and corrupted blobs cannot claim complete coverage', async () => {
  const truncated = repository({}, { truncated: true });
  await assert.rejects(collectSkillSource(options, truncated.transport), /tree is incomplete/);
  const normal = repository();
  await assert.rejects(collectSkillSource({ ...options, ref: 'c'.repeat(40) }, normal.transport), /identity/);
  const corrupt = await collectSkillSource(options, repository({}, { corrupt: true }).transport);
  assert.equal(corrupt.status, 'incomplete');
  assert.equal(corrupt.files.length, 0);
  assert.ok(corrupt.unresolved.every(item => /pinned tree/.test(item.reason)));
});

test('symlinks, oversized content and repository escapes remain unresolved', async () => {
  const fixture = repository({ 'skills/review/SKILL.md': '[outside](../../../secret.md) [large](large.md) `scripts/check.mjs`', 'skills/review/large.md': 'x'.repeat(128 * 1024 + 1) }, { symlink: 'skills/review/scripts/check.mjs' });
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'incomplete');
  for (const reason of ['outside-or-invalid-link', 'collection-budget-exceeded', 'not-a-regular-file']) assert.ok(result.unresolved.some(item => item.reason === reason), reason);
});

test('absolute and encoded-root links cannot be reinterpreted as sibling repository files', async () => {
  const fixture = repository({ 'skills/review/SKILL.md': '[root](%2foutside.md)', 'skills/review/outside.md': 'Do not reinterpret an absolute link.' });
  const result = await collectSkillSource(options, fixture.transport);
  assert.equal(result.status, 'incomplete');
  assert.ok(result.unresolved.some(item => item.reason === 'outside-or-invalid-link'));
  assert.ok(!result.files.some(file => file.path.endsWith('outside.md')));
});

test('HTTP and redirect failures keep collected evidence and suppress remote error contents', async () => {
  const fixture = repository();
  const failed = fixture.entries.find(entry => entry.path.endsWith('guide.md')).sha;
  const result = await collectSkillSource(options, repository({}, { failBlob: failed }).transport);
  assert.equal(result.status, 'incomplete');
  assert.ok(result.files.some(file => file.role === 'instructions'));
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_REMOTE_ERROR/);
  let calls = 0;
  await assert.rejects(collectSkillSource(options, async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://attacker/' } }); }), /HTTP 302/);
  assert.equal(calls, 1);
});

test('network retry is bounded and body downloads share the source deadline', async () => {
  const fixture = repository();
  let calls = 0;
  const result = await collectSkillSource(options, async (...args) => {
    if (++calls === 1) throw new TypeError('PRIVATE_TRANSPORT');
    return fixture.transport(...args);
  });
  assert.equal(result.status, 'complete');
  assert.equal(result.connectionRetried, true);
  calls = 0;
  await assert.rejects(collectSkillSource(options, async () => { calls++; throw new TypeError('PRIVATE_TRANSPORT'); }), /source-network-failed/);
  assert.equal(calls, 2);
  await assert.rejects(collectSkillSource({ ...options, timeoutMs: 100 }, async (_url, { signal }) => new Response(new ReadableStream({ start(controller) { signal.addEventListener('abort', () => controller.error(new Error('PRIVATE_ABORT')), { once: true }); } }))), /source-deadline-exhausted/);
});

test('source cleanup failures preserve bounded errors without transport or response details', async () => {
  await assert.rejects(collectSkillSource(options, async () => { throw Error('PRIVATE_TRANSPORT'); }), error => error.message === 'source-network-failed');
  for (const status of [302, 503]) await assert.rejects(collectSkillSource(options, async () => ({ok:false,status,body:{cancel:async()=>{throw Error('PRIVATE_CANCEL');}}})), error => error.message.includes(`HTTP ${status}`) && !error.message.includes('PRIVATE_CANCEL'));
  await assert.rejects(collectSkillSource(options, async () => ({ok:true,headers:new Headers({'content-length':String(512*1024+1)}),body:{cancel:async()=>{throw Error('PRIVATE_CANCEL');}}})), error => /size limit/.test(error.message) && !/PRIVATE_CANCEL/.test(error.message));
});
