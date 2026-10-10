import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let configuredRoot;
try {
  const config = JSON.parse(await readFile(new URL('../.adaptive-skill-router/local-settings.json', import.meta.url), 'utf8'));
  if (typeof config.testRoot !== 'string' || !config.testRoot.trim()) throw new Error('Local testRoot must be a non-empty path.');
  configuredRoot = config.testRoot;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
export async function sandbox(t) {
  const base = process.env.ASR_TEST_ROOT ?? configuredRoot ?? tmpdir();
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, 'asr-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
export async function put(root, path, content) {
  const file = join(root, path);
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, content, 'utf8');
  return file;
}
export async function skill(root, path, name, description, body = 'Use this focused method only when it helps.') {
  return put(root, `${path}/SKILL.md`, `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n${body}\n`);
}
export function options(root) { return { cwd: root, home: join(root, 'home'), env: {}, roots: [{ path: root, host: 'codex', scope: 'custom' }] }; }
export function evidence(task, changes = {}) {
  return { task, explored: true, findings: ['Observed a bounded local behavior and inspected existing checks.'], unknowns: [], scope: 'local', risk: 'low', requirementsClear: true, verificationReady: true, ...changes };
}
