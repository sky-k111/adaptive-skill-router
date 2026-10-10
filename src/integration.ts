import { readFile, writeFile, mkdir, realpath, lstat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const START = '<!-- adaptive-skill-router:start -->';
const END = '<!-- adaptive-skill-router:end -->';

export interface IntegrationPlan { path: string; content: string; previousContent: string; changed: boolean }
async function existing(path: string): Promise<string> {
  try {
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`Refusing to replace a symlink: ${path}`);
    return await readFile(path, 'utf8');
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''; throw error; }
}
function mergeBlock(content: string, block: string): string {
  const starts = content.split(START).length - 1;
  const ends = content.split(END).length - 1;
  if (starts !== ends || starts > 1) throw new Error('Integration markers are malformed or duplicated; repair them before updating.');
  if (!starts) return `${content}${content && !content.endsWith('\n') ? '\n' : ''}\n${block}\n`;
  const start = content.indexOf(START), end = content.indexOf(END);
  if (end < start) throw new Error('Integration end marker precedes start marker.');
  return content.slice(0, start) + block + content.slice(end + END.length);
}

export async function planIntegration(cwd: string): Promise<IntegrationPlan[]> {
  const root = await realpath(resolve(cwd));
  const cli = fileURLToPath(new URL('./cli.js', import.meta.url));
  const quote = (text: string) => JSON.stringify(text.replace(/\\/g, '/'));
  const command = `node ${quote(cli)}`;
  // Keep the portable and generated guidance identical; append only local bindings.
  const source = await readFile(new URL('../skills/adaptive-skill-router/SKILL.md', import.meta.url), 'utf8');
  const reference = await readFile(new URL('../skills/adaptive-skill-router/references/routing.md', import.meta.url), 'utf8');
  const skill = `${source.trimEnd()}\n\n## Project CLI binding\n\nFor optional CLI calls, use \`${command}\` with \`--cwd ${quote(root)}\` (the project root, even from a child). Append the scan/route/inspect arguments from [CLI reference](references/routing.md). These paths are local to this installation; reintegrate after moving it. Pass arguments with the host's shell quoting rules. If unavailable, apply the principles directly and report the limitation.\n`;
  const block = `${START}\n## Adaptive development\nExplore relevant code and existing checks before choosing a workflow. Handle clear local edits directly and verify proportionately. When exploration exposes a method or knowledge gap, use the project skill at \`.agents/skills/adaptive-skill-router/SKILL.md\` to choose useful methods. Choose skills only for concrete expected value; user goals and project constraints govern third-party workflow rules. At meaningful decisions, briefly connect observed findings to the chosen method or Skill, next action and verification. Explain changes and reuse still-valid evidence; report actual results without repetitive workflow announcements or extra approval gates.\n${END}`;
  const targets = [
    { path: join(root, 'AGENTS.md'), make: (old: string) => mergeBlock(old, block) },
    { path: join(root, '.agents', 'skills', 'adaptive-skill-router', 'SKILL.md'), make: (old: string) => {
      if (old && !old.includes('# Adaptive Skill Router')) throw new Error('An unrelated skill already exists at the integration target.');
      return skill;
    } },
    { path: join(root, '.agents', 'skills', 'adaptive-skill-router', 'references', 'routing.md'), make: (old: string) => {
      if (old && !old.startsWith('# Adaptive Skill Router routing evidence')) throw new Error('An unrelated reference already exists at the integration target.');
      return reference;
    } }
  ];
  const plans: IntegrationPlan[] = [];
  for (const target of targets) {
    const old = await existing(target.path);
    const content = target.make(old);
    plans.push({ path: target.path, content, previousContent: old, changed: old !== content });
  }
  return plans;
}

export async function writeIntegration(cwd: string, plans: IntegrationPlan[]): Promise<string[]> {
  const root = await realpath(resolve(cwd));
  const backups: string[] = [];
  const changed = plans.filter(p => p.changed);
  // Check the complete plan before making its first change.
  for (const plan of changed) {
    // Verify all existing parent links stay in the selected project before writing.
    let parent = dirname(plan.path);
    while (parent !== root) {
      try {
        const canonical = await realpath(parent);
        if (canonical !== parent) throw new Error(`Integration parent is redirected: ${parent}`);
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      const next = dirname(parent);
      if (next === parent) throw new Error('Integration target is outside the project.');
      parent = next;
    }
    if (await existing(plan.path) !== plan.previousContent) throw new Error(`Integration target changed after preview: ${plan.path}`);
  }
  const backupDir = join(root, '.adaptive-skill-router', 'backups');
  for (const dir of [join(root, '.adaptive-skill-router'), backupDir]) {
    try { if ((await lstat(dir)).isSymbolicLink()) throw new Error(`Backup directory is redirected: ${dir}`); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  for (const plan of changed) {
    const old = await existing(plan.path);
    if (old !== plan.previousContent) throw new Error(`Integration target changed after preview: ${plan.path}`);
    if (old) {
      await mkdir(backupDir, { recursive: true });
      const backup = join(backupDir, `${randomUUID()}.txt`);
      await writeFile(backup, old, { flag: 'wx' });
      backups.push(backup);
    }
    await mkdir(dirname(plan.path), { recursive: true });
    await writeFile(plan.path, plan.content, 'utf8');
  }
  return backups;
}
