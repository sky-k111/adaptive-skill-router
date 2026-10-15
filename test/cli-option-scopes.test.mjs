import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sandbox, put } from './helpers.mjs';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const catalogCommands = ['scan', 'discover', 'route', 'inspect'];
const requests = {
  scan: [], discover: ['browser'], route: ['Debug failure'], inspect: ['exact-id'],
  init: [], source: ['example/library']
};
// This matrix describes the public contract, independently of the CLI parser.
const options = [
  ['write', undefined, ['init']],
  ...['evidence', 'skill', 'task-file'].map(name => [name, 'unused', ['route']]),
  ['limit', '5', ['route', 'discover']],
  ['native', undefined, catalogCommands], ['codex-bin', 'must-not-start', catalogCommands],
  ['root', 'unused', catalogCommands], ['no-defaults', undefined, catalogCommands],
  ['include-plugin-cache', undefined, catalogCommands],
  ['online', undefined, ['discover']], ['owner', 'example', ['discover']],
  ...['require', 'exclude'].map(name => [name, 'browser', ['discover']]),
  ['path', 'skill/SKILL.md', ['source']], ['ref', 'main', ['source']],
  ['include', 'LICENSE', ['source']], ['expect', 'a'.repeat(64), ['inspect']],
  ['proxy', 'http://127.0.0.1:1', ['discover', 'source']]
];

async function guardFile(root) {
  return put(root, 'guard.mjs', `
import fs from 'node:fs/promises';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
const deny = name => () => {
  process.stderr.write('UNEXPECTED_BOUNDARY:' + name + '\\n');
  throw new Error('UNEXPECTED_BOUNDARY:' + name);
};
for (const name of ['readFile', 'readdir', 'stat', 'access', 'realpath', 'mkdir', 'writeFile', 'appendFile', 'copyFile', 'rename']) fs[name] = deny(name);
for (const name of ['spawn', 'execFile', 'exec']) childProcess[name] = deny(name);
globalThis.fetch = deny('fetch');
syncBuiltinESMExports();
`);
}

async function rejectBeforeEffects(root, guard, args, option) {
  await assert.rejects(run(process.execPath, [
    '--import', pathToFileURL(guard).href, cli, ...args, '--cwd', root, '--json'
  ], { cwd: root, windowsHide: true }), error => {
    assert.equal(error.code, 1, args.join(' '));
    assert.equal(error.stdout, '', args.join(' '));
    assert.ok(error.stderr.includes(`--${option}`), error.stderr);
    assert.match(error.stderr, /only|requires|supported/, error.stderr);
    assert.doesNotMatch(error.stderr, /UNEXPECTED_BOUNDARY/, args.join(' '));
    return true;
  });
}

test('every out-of-scope option fails before reads, discovery, retrieval or writes', async t => {
  const root = await sandbox(t);
  const guard = await guardFile(root);
  for (const [command, args] of Object.entries(requests)) await t.test(command, async () => {
    for (const [name, value, allowed] of options) {
      if (allowed.includes(command)) continue;
      const flag = value === undefined ? [`--${name}`] : [`--${name}`, value];
      await rejectBeforeEffects(root, guard, [command, ...args, ...flag], name);
    }
  });
  assert.deepEqual(await readdir(root), ['guard.mjs']);
});

test('scope validation checks presence, equals syntax, repeats and flags before commands', async t => {
  const root = await sandbox(t);
  const guard = await guardFile(root);
  for (const [args, name] of [
    [['--write', 'scan'], 'write'],
    [['scan', '--evidence='], 'evidence'],
    [['inspect', 'exact-id', '--task-file='], 'task-file'],
    [['init', '--write', '--limit='], 'limit'],
    [['init', '--write', '--codex-bin='], 'codex-bin'],
    [['scan', '--skill=one', '--skill=two'], 'skill'],
    [['scan', '--root=one', '--root=two', '--write'], 'write'],
    [['source', 'example/library', '--path=skill/SKILL.md', '--write'], 'write']
  ]) await rejectBeforeEffects(root, guard, args, name);
});

test('--codex-bin requires --native for all catalog commands, including empty values', async t => {
  const root = await sandbox(t);
  const guard = await guardFile(root);
  for (const command of catalogCommands) for (const value of ['must-not-start', '']) {
    await assert.rejects(run(process.execPath, [
      '--import', pathToFileURL(guard).href, cli, command, ...requests[command],
      `--codex-bin=${value}`, '--cwd', root
    ], { cwd: root, windowsHide: true }), error => {
      assert.equal(error.code, 1);
      assert.equal(error.stdout, '');
      assert.match(error.stderr, /--codex-bin.*requires --native/);
      assert.doesNotMatch(error.stderr, /UNEXPECTED_BOUNDARY/);
      return true;
    });
  }
});

test('in-scope options still reach command execution with their required companion flags', async t => {
  const root = await sandbox(t);
  const guard = await guardFile(root);
  for (const [name, value, allowed] of options) for (const command of allowed) {
    const args = [command, ...(name === 'task-file' ? [] : requests[command])];
    if (command === 'source' && name !== 'path') args.push('--path', 'skill/SKILL.md');
    if (catalogCommands.includes(command)) {
      if (['native', 'codex-bin'].includes(name)) {
        if (name !== 'native') args.push('--native');
      } else {
        if (name !== 'root') args.push('--root', root);
        if (name !== 'no-defaults') args.push('--no-defaults');
      }
    }
    if (command === 'discover' && ['owner', 'proxy'].includes(name)) args.push('--online');
    args.push(`--${name}`);
    if (value !== undefined) args.push(value);
    const result = await run(process.execPath, [
      '--import', pathToFileURL(guard).href, cli, ...args, '--cwd', root, '--json'
    ], { cwd: root, windowsHide: true }).catch(error => error);
    assert.match(result.stderr, /UNEXPECTED_BOUNDARY/, args.join(' '));
    assert.doesNotMatch(result.stderr, /supported only|source-specific options/, args.join(' '));
  }
});

test('valid init writes and a task after -- remain supported', async t => {
  const root = await sandbox(t);
  const { stdout } = await run(process.execPath, [cli, 'init', '--write', '--cwd', root, '--json'], { cwd: root, windowsHide: true });
  assert.equal(JSON.parse(stdout).written, true);
  assert.ok((await readdir(root)).includes('AGENTS.md'));
  const routed = await run(process.execPath, [
    cli, 'route', '--cwd', root, '--no-defaults', '--root', root, '--json', '--', '--write'
  ], { cwd: root, windowsHide: true });
  assert.equal(JSON.parse(routed.stdout).action, 'explore');
  assert.equal(routed.stderr, '');
});

test('help and version keep their early-exit behavior without accessing command resources', async t => {
  const root = await sandbox(t);
  const guard = await guardFile(root);
  for (const args of [[], ['--help'], ['-h'], ['scan', '--write', '--help'], ['init', '--native', '-h']]) {
    const { stdout, stderr } = await run(process.execPath, [
      '--import', pathToFileURL(guard).href, cli, ...args, '--cwd', root
    ], { cwd: root, windowsHide: true });
    assert.match(stdout, /Adaptive Skill Router/);
    assert.equal(stderr, '');
  }
  for (const args of [['--version'], ['scan', '--write', '--version'], ['init', '--native', '--help', '--version']]) {
    const { stdout, stderr } = await run(process.execPath, [
      '--import', pathToFileURL(guard).href, cli, ...args, '--cwd', root
    ], { cwd: root, windowsHide: true });
    assert.equal(stdout.trim(), '0.1.0');
    assert.equal(stderr, '');
  }
});
