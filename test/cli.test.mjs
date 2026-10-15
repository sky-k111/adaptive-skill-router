import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import * as http from 'node:http';
import { createHash } from 'node:crypto';
import { sandbox, put, skill, evidence } from './helpers.mjs';
const run = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
async function invoke(root, args) {
  return run(process.execPath, [cli, ...args, '--cwd', root], { cwd: root, windowsHide: true });
}

test('CLI discovery is local by default and retains exact candidate identities without selecting', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/browser', 'browser-tests', 'Playwright browser testing');
  const { stdout } = await invoke(root, ['discover', 'Playwright', '--no-defaults', '--root', join(root, 'library'), '--json']);
  const result = JSON.parse(stdout);
  assert.equal(result.local.length, 1);
  assert.equal(result.local[0].eligibility, 'candidate');
  assert.equal(result.remote.status, 'not-requested');
  assert.deepEqual(result.selectedSkills, []);
  assert.deepEqual((await readdir(root)).sort(), ['library']);
});

test('CLI validates discovery scope and query before native discovery or network access', async t => {
  const root = await sandbox(t);
  for (const args of [
    ['discover'], ['discover', 'x'], ['discover', 'browser', '--owner', 'example'],
    ['discover', 'browser', '--online', '--owner', '../escape'],
    ['discover', 'browser', '--limit', '21'],
    ['discover', 'browser', '--task-file', 'missing.txt'],
    ['scan', '--online'], ['route', 'browser', '--online']
  ]) await assert.rejects(invoke(root, [...args, '--native', '--codex-bin', 'asr-nonexistent-binary-experience']), error => {
    assert.equal(error.code, 1);
    assert.doesNotMatch(error.stderr, /Unable to start Codex|network request|ENOENT/);
    return true;
  });
});

test('bad private network settings fail online without leaking secrets and do not affect offline discovery', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/browser', 'browser-tests', 'Playwright testing');
  await put(root, '.adaptive-skill-router/local-settings.json', '{PRIVATE_INVALID_SETTINGS');
  const args = ['discover', 'Playwright', '--no-defaults', '--root', join(root, 'library'), '--json'];
  assert.equal(JSON.parse((await invoke(root, args)).stdout).remote.status, 'not-requested');
  await assert.rejects(invoke(root, [...args, '--online']), error => {
    assert.equal(error.code, 2);
    const value = JSON.parse(error.stdout);
    assert.equal(value.local.length, 1);
    assert.match(value.remote.error, /Invalid local registry settings/);
    assert.doesNotMatch(error.stdout, /PRIVATE_INVALID_SETTINGS/);
    return true;
  });
});

test('CLI explicit proxy uses an actual CONNECT tunnel without contacting an external service', async t => {
  if (typeof http.setGlobalProxyFromEnv !== 'function') { t.skip('Explicit proxy configuration needs Node.js 24.14+.'); return; }
  const root = await sandbox(t);
  const targets = [];
  const server = http.createServer();
  server.on('connect', (request, socket) => {
    targets.push(request.url);
    socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const proxy = `http://127.0.0.1:${server.address().port}`;
  await assert.rejects(invoke(root, ['discover', 'browser', '--online', '--proxy', proxy, '--no-defaults', '--root', root, '--json']), error => {
    assert.equal(error.code, 2);
    assert.equal(JSON.parse(error.stdout).remote.status, 'failed');
    return true;
  });
  assert.deepEqual(targets, ['skills.sh:443', 'skills.sh:443']);
});

test('network configuration precedence is CLI then environment then private project settings', async t => {
  if (typeof http.setGlobalProxyFromEnv !== 'function') { t.skip('Explicit proxy configuration needs Node.js 24.14+.'); return; }
  const root = await sandbox(t);
  const bootstrap = await put(root, 'transport.mjs', 'globalThis.fetch = async () => Response.json({skills: []});\n');
  const settings = '.adaptive-skill-router/local-settings.json';
  const common = ['--import', pathToFileURL(bootstrap).href, cli, 'discover', 'browser', '--online', '--no-defaults', '--root', root, '--cwd', root, '--json'];
  await put(root, settings, JSON.stringify({ registryProxy: 'PRIVATE_BAD_PROXY' }));
  const cases = [
    { args: ['--proxy', 'http://127.0.0.1:1'], env: { ...process.env, ASR_HTTPS_PROXY: 'PRIVATE_BAD_ENV' } },
    { args: [], env: { ...process.env, ASR_HTTPS_PROXY: 'http://127.0.0.1:1' } }
  ];
  for (const { args, env } of cases) {
    const result = await run(process.execPath, [...common, ...args], { env, windowsHide: true });
    assert.equal(JSON.parse(result.stdout).remote.status, 'ok');
    assert.doesNotMatch(result.stdout, /PRIVATE_BAD/);
  }
  await put(root, settings, JSON.stringify({ registryProxy: 'http://127.0.0.1:1' }));
  const clean = { ...process.env };
  delete clean.ASR_HTTPS_PROXY;
  assert.equal(JSON.parse((await run(process.execPath, common, { env: clean, windowsHide: true })).stdout).remote.status, 'ok');
});

test('CLI online discovery preserves local results on service failure and marks partial failure', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/browser', 'browser-tests', 'Playwright browser testing');
  const bootstrap = await put(root, 'transport.mjs', "globalThis.fetch = async () => new Response('private error body', { status: 503 });\n");
  await assert.rejects(run(process.execPath, ['--import', pathToFileURL(bootstrap).href, cli, 'discover', 'Playwright', '--online', '--no-defaults', '--root', join(root, 'library'), '--cwd', root, '--json'], { windowsHide: true }), error => {
    assert.equal(error.code, 2);
    const result = JSON.parse(error.stdout);
    assert.equal(result.local.length, 1);
    assert.equal(result.remote.status, 'failed');
    assert.match(result.remote.error, /HTTP 503/);
    assert.doesNotMatch(error.stdout, /private error body/);
    assert.deepEqual(result.selectedSkills, []);
    return true;
  });
});

test('standalone helper and CLI return equivalent remote identities without installing files', async t => {
  const root = await sandbox(t);
  const bootstrap = await put(root, 'transport.mjs', `globalThis.fetch = async () => Response.json({ skills: [{ id: 'example/library/browser-tests', source: 'example/library', name: 'browser-tests', installs: 1 }] });\n`);
  const helper = fileURLToPath(new URL('../skills/adaptive-workflow/scripts/search-skills.mjs', import.meta.url));
  const before = (await readdir(root)).sort();
  const helperRun = await run(process.execPath, ['--import', pathToFileURL(bootstrap).href, helper, '--query', 'Playwright'], { cwd: root, windowsHide: true });
  const cliRun = await run(process.execPath, ['--import', pathToFileURL(bootstrap).href, cli, 'discover', 'Playwright', '--online', '--no-defaults', '--root', root, '--cwd', root, '--json'], { windowsHide: true });
  const standalone = JSON.parse(helperRun.stdout);
  const discovery = JSON.parse(cliRun.stdout);
  assert.equal(discovery.remote.status, 'ok');
  assert.deepEqual(discovery.remote.candidates, standalone.candidates);
  assert.equal(standalone.candidates[0].id, 'skills.sh:example/library/browser-tests');
  assert.deepEqual(discovery.selectedSkills, []);
  assert.deepEqual((await readdir(root)).sort(), before);
});
test('CLI task files preserve arbitrary text without evaluating it', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/debug', 'debug', 'Debug root causes');
  const task = 'Fix literal $(Get-Secret) `value` and quotes "x"';
  const taskFile = await put(root, 'task.txt', task + '\n');
  const evidenceFile = await put(root, 'evidence.json', JSON.stringify(evidence(task)));
  const { stdout } = await invoke(root, ['route', '--task-file', taskFile, '--evidence', evidenceFile, '--no-defaults', '--root', join(root, 'library'), '--json']);
  assert.equal(JSON.parse(stdout).action, 'direct');
  assert.equal(await readFile(taskFile, 'utf8'), task + '\n');
});
test('CLI preview leaves the selected project unchanged', async t => {
  const root = await sandbox(t);
  const { stdout } = await invoke(root, ['init', '--json']);
  assert.equal(JSON.parse(stdout).written, false);
  assert.deepEqual(await readdir(root), []);
});
test('CLI rejects mixed native and disk discovery and unsupported hosts', async t => {
  const root = await sandbox(t);
  await assert.rejects(invoke(root, ['scan', '--native', '--root', root]), error => /do not combine/.test(error.stderr));
  await assert.rejects(invoke(root, ['scan', '--host', 'claude']), error => /Unknown option/.test(error.stderr));
});
test('CLI rejects invalid requests before native discovery', async t => {
  const root = await sandbox(t);
  const emptyTask = await put(root, 'empty-task.txt', ' \n');
  const invalidJson = await put(root, 'invalid-evidence.json', '{');
  const staleEvidence = await put(root, 'stale-evidence.json', JSON.stringify(evidence('old task')));
  const missingFile = join(root, 'missing.txt');
  const cases = [
    { args: ['route'], message: /non-empty task/ },
    { args: ['route', ' \t '], message: /non-empty task/ },
    { args: ['route', '--task-file', emptyTask], message: /non-empty task/ },
    { args: ['route', 'example', '--task-file', missingFile], message: /not both/ },
    { args: ['scan', 'unexpected'], message: /scan takes no positional/ },
    { args: ['inspect'], message: /one exact skill id/ },
    { args: ['inspect', 'one', 'two'], message: /one exact skill id/ },
    { args: ['inspect', 'one', '--expect', 'invalid'], message: /inspectionFingerprint/ },
    { args: ['scan', '--expect', 'a'.repeat(64)], message: /only by inspect/ },
    ...['0', '21', '1.5', 'NaN', '', 'Infinity'].map(limit => ({ args: ['route', 'example', '--limit', limit], message: /integer between 1 and 20/ })),
    { args: ['route', '--task-file', missingFile], message: /ENOENT/ },
    { args: ['route', 'example', '--evidence', missingFile], message: /ENOENT/ },
    { args: ['route', 'example', '--evidence', invalidJson], message: /JSON/ },
    { args: ['route', 'example', '--evidence', staleEvidence], message: /exactly match/ }
  ];
  for (const { args, message } of cases) {
    await assert.rejects(invoke(root, [...args, '--native', '--codex-bin', 'asr-nonexistent-binary-experience']), error => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, message, args.join(' '));
      assert.doesNotMatch(error.stderr, /Unable to start Codex/);
      return true;
    });
  }
});
test('CLI valid requests still reach native discovery', async t => {
  const root = await sandbox(t);
  for (const args of [['scan'], ['inspect', 'example'], ['route', 'example', '--limit', '1'], ['route', 'example', '--limit', '20']]) {
    await assert.rejects(invoke(root, [...args, '--native', '--codex-bin', 'asr-nonexistent-binary-experience']), error => /Unable to start Codex/.test(error.stderr));
  }
});
test('CLI preserves valid catalog, route and inspect outputs', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/debug', 'debug', 'Debug root causes');
  await skill(root, 'library/debug-extra', 'debug-extra', 'Debug root causes');
  const common = ['--no-defaults', '--root', join(root, 'library'), '--json'];
  const { stdout: scanned } = await invoke(root, ['scan', ...common]);
  const catalog = JSON.parse(scanned);
  assert.equal(catalog.skills.length, 2);
  assert.deepEqual(catalog.diagnostics, []);
  const task = 'Debug failure';
  const evidenceFile = await put(root, 'evidence.json', JSON.stringify(evidence(task, { rootCauseKnown: false, production: true })));
  for (const limit of ['1', '20']) {
    const { stdout } = await invoke(root, ['route', task, '--evidence', evidenceFile, '--limit', limit, ...common]);
    const decision = JSON.parse(stdout);
    assert.equal(decision.action, 'consider-skills');
    assert.equal(decision.candidates.length, limit === '1' ? 1 : 2);
    assert.ok(decision.candidates.every(c => c.inspectionFingerprint === catalog.skills.find(s => s.id === c.id).inspectionFingerprint));
    assert.deepEqual(decision.selectedSkills, []);
    assert.equal(decision.approvalCheckRequired, true);
    assert.deepEqual(decision.diagnostics, []);
  }
  const selected = catalog.skills[0];
  const { stdout: explicitlyRequested } = await invoke(root, ['route', task, '--skill', selected.id, ...common]);
  const decision = JSON.parse(explicitlyRequested);
  assert.equal(decision.candidates[0].id, selected.id);
  assert.deepEqual(decision.selectedSkills, []);
  const { stdout: inspected } = await invoke(root, ['inspect', selected.id, ...common]);
  const inspectedSkill = JSON.parse(inspected);
  assert.deepEqual(inspectedSkill.skill, selected);
  assert.equal(inspectedSkill.content, await readFile(selected.path, 'utf8'));
  assert.match(inspectedSkill.warning, /not authorization/);
});

test('CLI binds discovery to inspection and refuses changed instructions or invocation policy', async t => {
  for (const change of ['instructions', 'invocation-policy']) await t.test(change, async t => {
    const root = await sandbox(t);
    const path = await skill(root, 'library/browser', 'browser-tests', 'Playwright browser testing');
    const common = ['--no-defaults', '--root', join(root, 'library'), '--json'];
    const discover = async () => JSON.parse((await invoke(root, ['discover', 'Playwright', ...common])).stdout).local[0];
    const selected = await discover();
    const inspect = token => invoke(root, ['inspect', selected.id, '--expect', token, ...common]);
    assert.equal(JSON.parse((await inspect(selected.inspectionFingerprint)).stdout).skill.inspectionFingerprint, selected.inspectionFingerprint);
    if (change === 'instructions') await put(root, 'library/browser/SKILL.md', (await readFile(path, 'utf8')) + '\nNEW_INSTRUCTION_SENTINEL');
    else await put(root, 'library/browser/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
    await assert.rejects(inspect(selected.inspectionFingerprint), error => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /rescan/);
      assert.doesNotMatch(error.stderr, /NEW_INSTRUCTION_SENTINEL/);
      return true;
    });
    const fresh = await discover();
    assert.equal(fresh.id, selected.id);
    assert.notEqual(fresh.inspectionFingerprint, selected.inspectionFingerprint);
    if (change === 'invocation-policy') assert.equal(fresh.eligibility, 'explicit-only');
    assert.equal(JSON.parse((await inspect(fresh.inspectionFingerprint)).stdout).skill.id, fresh.id);
    // Without --expect, inspect deliberately reads the latest discovered version.
    assert.equal(JSON.parse((await invoke(root, ['inspect', fresh.id, ...common])).stdout).skill.inspectionFingerprint, fresh.inspectionFingerprint);
  });
});

test('CLI discovery constraints and the standalone helper keep the same filtered identities', async t => {
  const root = await sandbox(t);
  await skill(root, 'library/mobile', 'mobile-cli', 'Capacitor deployment');
  await skill(root, 'library/node', 'node-cli', 'Node.js testing');
  const bootstrap = await put(root, 'transport.mjs', `globalThis.fetch = async () => Response.json({skills: [{id:'example/library/capacitor-cli',source:'example/library',name:'capacitor-cli'}, {id:'example/library/node-cli',source:'example/library',name:'node-cli'}]});`);
  const flags = ['--query', 'node cli', '--exclude', 'capacitor'];
  const helper = fileURLToPath(new URL('../skills/adaptive-workflow/scripts/search-skills.mjs', import.meta.url));
  const helperResult = JSON.parse((await run(process.execPath, ['--import', pathToFileURL(bootstrap).href, helper, ...flags], { cwd: root, windowsHide: true })).stdout);
  const result = JSON.parse((await run(process.execPath, ['--import', pathToFileURL(bootstrap).href, cli, 'discover', 'node cli', '--exclude', 'capacitor', '--online', '--no-defaults', '--root', join(root, 'library'), '--cwd', root, '--json'], { windowsHide: true })).stdout);
  assert.deepEqual(result.local.map(s => s.name), ['node-cli']);
  assert.deepEqual(result.remote.candidates, helperResult.candidates);
  assert.equal(result.remote.filteredCandidates[0].slug, 'capacitor-cli');
  await assert.rejects(invoke(root, ['discover', 'node', '--exclude', '\nprivate', '--native', '--codex-bin', 'must-not-start']), error => /Constraints/.test(error.stderr) && !/Unable to start/.test(error.stderr));
});

test('CLI and standalone source collection agree, report incomplete material and make no installation writes', async t => {
  const root = await sandbox(t), commit = 'a'.repeat(40), tree = 'b'.repeat(40);
  const contents = { 'skill/SKILL.md': '[Required reference](missing.md)', LICENSE: 'Example license' };
  const entries = [], blobs = {};
  for (const [path, content] of Object.entries(contents)) {
    const bytes = Buffer.from(content), sha = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
    entries.push({path, type:'blob', mode:'100644', size:bytes.length, sha});
    blobs[sha] = { sha, encoding:'base64', size:bytes.length, content:bytes.toString('base64') };
  }
  const bootstrap = await put(root, 'transport.mjs', `const entries=${JSON.stringify(entries)}, blobs=${JSON.stringify(blobs)}; globalThis.fetch=async url => Response.json(String(url).includes('/commits/') ? {sha:'${commit}',commit:{tree:{sha:'${tree}'}}} : String(url).includes('/git/trees/') ? {sha:'${tree}',truncated:false,tree:entries} : blobs[String(url).split('/').at(-1)]);`);
  const helper = fileURLToPath(new URL('../skills/adaptive-workflow/scripts/collect-source.mjs', import.meta.url));
  const before = (await readdir(root)).sort();
  const results = [];
  for (const args of [[helper, '--source', 'example/library', '--path', 'skill/SKILL.md'], [cli, 'source', 'example/library', '--path', 'skill/SKILL.md', '--cwd', root, '--json']]) {
    await assert.rejects(run(process.execPath, ['--import', pathToFileURL(bootstrap).href, ...args], { cwd: root, windowsHide: true }), error => {
      assert.equal(error.code, 2);
      const result = JSON.parse(error.stdout);
      assert.equal(result.status, 'incomplete');
      assert.equal(result.reviewStatus, 'not-reviewed');
      assert.equal(result.commit, commit);
      assert.ok(result.unresolved.some(item => item.path === 'skill/missing.md'));
      results.push(result);
      return true;
    });
  }
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual((await readdir(root)).sort(), before);
  await assert.rejects(invoke(root, ['source', 'example/library', '--path', '../SKILL.md']), error => /repository-relative/.test(error.stderr));
  await assert.rejects(invoke(root, ['source', 'example/library', '--path', 'skill/SKILL.md', '--native']), error => /source-specific/.test(error.stderr));
});
