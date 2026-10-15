import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';
import { scanSkills } from './scanner.js';
import type { Catalog, ScanOptions } from './types.js';

interface NativeSkill { name: string; path: string; enabled: boolean }
interface NativeListing { data: Array<{ cwd: string; skills: NativeSkill[]; errors?: unknown[] }> }

export async function listNativeSkills(cwd: string, binary = 'codex', timeoutMs = 15000): Promise<NativeListing> {
  return new Promise((accept, reject) => {
    const child = spawn(binary, ['app-server'], { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, shell: false });
    const lines = createInterface({ input: child.stdout });
    let settled = false;
    let bytes = 0;
    const finish = (error?: Error, result?: NativeListing) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      lines.close();
      child.stdin.end();
      child.kill();
      if (error) reject(error); else accept(result!);
    };
    const timer = setTimeout(() => finish(new Error('Codex skills/list timed out; retry or use disk discovery.')), timeoutMs);
    const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
    child.stdin.on('error', () => finish(new Error('Codex app-server input closed unexpectedly.')));
    child.on('error', () => finish(new Error('Unable to start Codex. Set --codex-bin to a trusted executable; Windows .cmd shims are not supported.')));
    child.on('exit', () => finish(new Error('Codex exited before skills/list completed.')));
    // Drain diagnostics without printing potentially sensitive runtime configuration.
    child.stderr.on('data', () => {});
    child.stdout.on('data', chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > 4 * 1024 * 1024) finish(new Error('Codex app-server output exceeded the discovery limit.'));
    });
    lines.on('line', line => {
      try {
        const message = JSON.parse(line);
        if (message.id === 0) {
          if (message.error) { finish(new Error('Codex initialization was rejected.')); return; }
          send({ method: 'initialized', params: {} });
          send({ method: 'skills/list', id: 1, params: { cwds: [resolve(cwd)], forceReload: true } });
        }
        if (message.id === 1) {
          if (message.error) { finish(new Error('This Codex version rejected skills/list. Use disk discovery or update the compatible CLI.')); return; }
          if (!message.result || !Array.isArray(message.result.data)) { finish(new Error('Unexpected skills/list response.')); return; }
          finish(undefined, message.result);
        }
      } catch { finish(new Error('Invalid JSON from Codex app-server.')); }
    });
    send({ method: 'initialize', id: 0, params: { clientInfo: { name: 'adaptive_skill_router', title: 'Adaptive Skill Router', version: '0.1.0' } } });
  });
}

export async function scanNativeSkills(options: ScanOptions & { binary?: string; timeoutMs?: number } = {}): Promise<Catalog> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const listing = await listNativeSkills(cwd, options.binary, options.timeoutMs);
  const records = listing.data.filter(row => resolve(row.cwd) === cwd).flatMap(row => row.skills ?? []);
  const valid = records.filter(s => typeof s.path === 'string' && typeof s.name === 'string' && typeof s.enabled === 'boolean');
  // Runtime entries identify manifests, not recursive discovery roots. A missing
  // manifest must not promote a nested skill or consume its scan budget.
  const catalog = await scanSkills({ ...options, cwd, maxDepth: 0, roots: valid.map(s => ({ path: dirname(s.path), host: 'codex', scope: 'custom' })) });
  catalog.skills = catalog.skills.filter(skill => {
    const record = valid.find(s => resolve(s.path) === resolve(skill.path));
    if (!record) return false;
    // Runtime disabled state is authoritative; never relax a local restriction.
    skill.disabled ||= !record.enabled;
    skill.advisories.push('native-cli-discovery-not-desktop-session');
    return true;
  });
  if (records.length !== valid.length) catalog.diagnostics.push({ code: 'native-metadata-incomplete', path: cwd, message: 'Some native skills lack local paths or enablement fields and were excluded.' });
  if (listing.data.some(row => row.errors?.length)) catalog.diagnostics.push({ code: 'native-discovery-errors', path: cwd, message: 'Codex reported discovery errors; catalog may be incomplete.' });
  return catalog;
}
