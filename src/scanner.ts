import { readdir, readFile, realpath, stat, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { parse as parseToml } from 'smol-toml';
import type { Catalog, Diagnostic, Method, Root, ScanOptions, Skill } from './types.js';

const MAX_BYTES = 512 * 1024;
const IGNORE = new Set(['node_modules', '.git', '.venv', 'venv', 'dist', '__pycache__']);
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const boolean = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && [0, 1].includes(value)) return value === 1;
  if (typeof value === 'string' && /^(true|yes|on|1|false|no|off|0)$/i.test(value)) return /^(true|yes|on|1)$/i.test(value);
  throw new Error('Invocation flags must be booleans.');
};
export async function projectChain(cwd: string): Promise<string[]> {
  const start = resolve(cwd);
  const chain: string[] = [];
  let dir = start;
  while (true) {
    chain.push(dir);
    try { await access(join(dir, '.git')); return chain; } catch { /* continue */ }
    const parent = dirname(dir);
    if (parent === dir) return [start];
    dir = parent;
  }
}

export async function discoverRoots(options: ScanOptions = {}): Promise<Root[]> {
  if (options.roots) return options.roots;
  const cwd = resolve(options.cwd ?? process.cwd());
  const home = resolve(options.home ?? homedir());
  const env = options.env ?? process.env;
  const roots: Root[] = [];
  const add = (path: string, h: Root['host'], scope: Root['scope']) => roots.push({ path, host: h, scope });
  const chain = await projectChain(cwd);
  {
    const codexHome = resolve(env.CODEX_HOME ?? join(home, '.codex'));
    add(join(home, '.agents', 'skills'), 'codex', 'user');
    add(join(codexHome, 'skills'), 'codex', 'user');
    for (const dir of chain) {
      add(join(dir, '.agents', 'skills'), 'codex', 'project');
      add(join(dir, '.codex', 'skills'), 'codex', 'project');
    }
    if (process.platform !== 'win32') add('/etc/codex/skills', 'codex', 'admin');
    if (options.includePluginCache) add(join(codexHome, 'plugins', 'cache'), 'codex', 'plugin-cache');
  }
  for (const path of options.extraRoots ?? []) add(resolve(cwd, path), 'codex', 'custom');
  return roots;
}

export function methodHints(name: string, description: string): Method[] {
  const text = `${name} ${description}`.toLowerCase();
  const out: Method[] = [];
  if (/debug|diagnos|root.cause|调试|诊断|根因/.test(text)) out.push('debug');
  if (/\btdd\b|test.driven|testing|\btests?\b|测试|回归/.test(text)) out.push('test');
  if (/planning|\bplan\b|specification|spec.driven|requirements|规划|计划|规格|需求/.test(text)) out.push('plan');
  if (/review|audit|审查|审计/.test(text)) out.push('review');
  if (!out.length) out.push('domain');
  return out;
}

function yamlMap(content: string): Record<string, unknown> {
  const doc = parseDocument(content, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(doc.errors[0]!.message);
  const result: unknown = doc.toJS({ maxAliasCount: 25 });
  if (!isObject(result)) throw new Error('Expected a YAML mapping.');
  return result;
}

async function boundedRead(path: string): Promise<string> {
  const info = await stat(path);
  if (!info.isFile() || info.size > MAX_BYTES) throw new Error(`Not a regular file or exceeds ${MAX_BYTES} bytes.`);
  return readFile(path, 'utf8');
}

async function hostRestrictions(options: ScanOptions, diagnostics: Diagnostic[]) {
  const home = resolve(options.home ?? homedir());
  const env = options.env ?? process.env;
  const disabled = new Set<string>();
  let configUncertain = false;
  const codexHome = resolve(env.CODEX_HOME ?? join(home, '.codex'));
  const config = join(codexHome, 'config.toml');
  try {
    const parsed = parseToml(await boundedRead(config));
    const skills = parsed.skills;
    if (isObject(skills) && Array.isArray(skills.config)) {
      for (const entry of skills.config) {
        if (isObject(entry) && entry.enabled === false && typeof entry.path === 'string') {
          const path = entry.path.startsWith('~/') ? join(home, entry.path.slice(2)) : resolve(codexHome, entry.path);
          disabled.add(await realpath(path).catch(() => path));
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({ code: 'config-invalid', path: config, message: 'Could not read Codex skill restrictions; automatic routing is disabled for Codex skills.' });
      configUncertain = true;
    }
  }
  return { disabled, configUncertain };
}

export async function scanSkills(options: ScanOptions = {}): Promise<Catalog> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const roots = await discoverRoots({ ...options, cwd });
  const diagnostics: Diagnostic[] = [];
  const restrictions = await hostRestrictions({ ...options, cwd }, diagnostics);
  if (!options.roots && !roots.some(root => root.scope === 'project' && dirname(dirname(root.path)) !== cwd)) {
    try { await access(join(cwd, '.git')); }
    catch {
      diagnostics.push({ code: 'project-scope-current-directory', path: cwd,
        message: 'No Git root found. Disk project discovery covers only this directory. Use --cwd with the intended project root or add --root for ancestor skills; custom roots do not register skills with Codex.' });
    }
  }
  const skills = new Map<string, Skill>();
  const maxDepth = options.maxDepth ?? 10;
  const maxFiles = options.maxFiles ?? 10000;
  let count = 0;
  let limitReported = false;
  for (const root of roots) {
    const visited = new Set<string>();
    const walk = async (path: string, depth: number): Promise<void> => {
      if (count >= maxFiles) {
        if (!limitReported) diagnostics.push({ code: 'scan-limit', path, message: 'Scan limit reached; catalog is incomplete.' });
        limitReported = true;
        return;
      }
      count++;
      let canonical: string;
      try { canonical = await realpath(path); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || depth > 0 || root.scope === 'custom') diagnostics.push({ code: 'unreadable', path, message: 'Unable to resolve directory.' });
        return;
      }
      if (visited.has(canonical)) return;
      visited.add(canonical);
      let entries;
      try { entries = await readdir(path, { withFileTypes: true }); } catch {
        diagnostics.push({ code: 'unreadable', path, message: 'Unable to read directory.' }); return;
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      const manifests = entries.filter(e => e.name.toLowerCase() === 'skill.md');
      if (manifests.length > 1) {
        diagnostics.push({ code: 'ambiguous-manifest', path, message: 'Multiple case-insensitive SKILL.md files.' });
        return;
      }
      if (manifests.length === 1) {
        const manifest = join(path, manifests[0]!.name);
        try {
          const source = (await boundedRead(manifest)).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
          const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source);
          if (!match) throw new Error('Missing YAML frontmatter.');
          const metadata = yamlMap(match[1]!);
          const name = metadata.name;
          const body = source.slice(match[0].length);
          const description = metadata.description;
          if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' || !description.trim()) throw new Error('Non-empty name and description are required.');
          const realPath = await realpath(manifest);
          const id = `${root.host}:${digest(realPath).slice(0, 16)}`;
          const existing = skills.get(id);
          if (existing) { existing.origins.push(manifest); return; }
          let automatic = true;
          const userInvocable = true;
          const disabled = restrictions.disabled.has(realPath) || restrictions.disabled.has(canonical);
          const advisories: string[] = [];
          if (root.host === 'codex') {
            try {
              const ui = yamlMap(await boundedRead(join(path, 'agents', 'openai.yaml')));
              if (isObject(ui.policy)) automatic = boolean(ui.policy.allow_implicit_invocation, true);
              if (ui.dependencies) advisories.push('declared-tool-dependencies');
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
            }
            if (restrictions.configUncertain) automatic = false;
          }
          if (/starting any conversation|before any response|1% chance|ANY bug|任何.*(对话|任务)|必须.*调用/i.test(`${description} ${body}`)) advisories.push('broad-trigger-policy');
          if (/superpowers:|\$[a-z][a-z-]+|invoke.*skill|use.*skill/i.test(body)) advisories.push('possible-chained-skills');
          if (metadata['allowed-tools']) advisories.push('declared-tool-permissions');
          if (root.scope === 'plugin-cache') advisories.push('plugin-enablement-unverified');
          skills.set(id, {
            id, name: name.trim(), description: description.trim(), path: manifest, realPath,
            host: root.host, scope: root.scope, origins: [manifest], fingerprint: digest(source),
            automatic, userInvocable, disabled,
            availability: root.scope === 'plugin-cache' ? 'unverified-plugin' : 'discovered',
            methods: methodHints(name, description), estimatedBodyTokens: Math.ceil(body.length / 4), advisories
          });
        } catch (error) {
          diagnostics.push({ code: 'invalid-skill', path: manifest, message: (error as Error).message });
        }
        return;
      }
      if (depth >= maxDepth) {
        if (entries.some(e => e.isDirectory() || e.isSymbolicLink())) diagnostics.push({ code: 'depth-limit', path, message: 'Maximum directory depth reached.' });
        return;
      }
      for (const entry of entries) {
        if (!IGNORE.has(entry.name) && (entry.isDirectory() || entry.isSymbolicLink())) {
          const target = join(path, entry.name);
          if (entry.isSymbolicLink()) {
            try { if (!(await stat(target)).isDirectory()) continue; } catch { diagnostics.push({ code: 'broken-link', path: target, message: 'Broken or unreadable symlink.' }); continue; }
          }
          await walk(target, depth + 1);
        }
      }
    };
    await walk(resolve(root.path), 0);
  }
  const list = [...skills.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  // Preserve collisions: filesystem discovery cannot prove host invocation resolution.
  for (const skill of list) {
    if (list.some(other => other.id !== skill.id && other.host === skill.host && other.name === skill.name)) skill.advisories.push('name-collision-use-path');
  }
  return { schemaVersion: 1, cwd, roots, skills: list, diagnostics };
}

export async function readSkill(skill: Skill): Promise<string> {
  const source = await boundedRead(skill.realPath);
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (digest(normalized) !== skill.fingerprint) throw new Error('Skill changed after discovery; rescan before loading.');
  return source;
}
