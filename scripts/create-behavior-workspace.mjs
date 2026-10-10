import { mkdir, writeFile, cp, access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planIntegration, writeIntegration } from '../dist/index.js';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Provide a fresh, explicit test workspace path.');
const target = resolve(process.argv[2]);
try { await access(target); throw new Error('Choose a fresh workspace; existing files will not be replaced.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(target, { recursive: true });
async function put(path, content) {
  const file = join(target, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, { flag: 'wx' });
}
await put('AGENTS.md', `# Evaluation project\n\nWork only in this sandbox. Keep the router source project read-only. No publishing, deployments, global configuration changes, or installing third-party frameworks. Use task evidence and proportionate validation. Tools and methods are optional unless needed to establish correctness. All cases use Node.js built-ins.\n`);
await cp(join(project, 'fixtures', 'skills'), join(target, '.agents', 'skills'), { recursive: true, errorOnExist: true });
await writeIntegration(target, await planIntegration(target));
await put('01-welcome/package.json', '{"type":"module","scripts":{"test":"node --test"}}\n');
await put('01-welcome/welcome.js', `export function welcome(name) { return 'Welcom, ' + name + '!'; }\n`);
await put('01-welcome/welcome.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { welcome } from './welcome.js';\ntest('welcomes a visitor', () => assert.equal(welcome('Ethan'), 'Welcome, Ethan!'));\n`);
await put('02-cache/package.json', '{"type":"module","scripts":{"test":"node --test"}}\n');
await put('02-cache/repository.js', `export function repository() {\n  const records = new Map([['north:42', {title: 'North note'}], ['south:42', {title: 'South note'}]]);\n  return { read(tenant, id) { return records.get(tenant + ':' + id); } };\n}\n`);
await put('02-cache/cache.js', `export function cache(reader) {\n  const saved = new Map();\n  return { read(tenant, id) {\n    if (!saved.has(id)) saved.set(id, reader.read(tenant, id));\n    return saved.get(id);\n  } };\n}\n`);
await put('02-cache/cache.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { repository } from './repository.js';\nimport { cache } from './cache.js';\ntest('repeated reads return the record', () => {\n  const reader = cache(repository());\n  assert.equal(reader.read('north', '42').title, 'North note');\n  assert.equal(reader.read('north', '42').title, 'North note');\n});\n`);
await put('03-output/package.json', '{"type":"module","scripts":{"test":"node --test"}}\n');
await put('03-output/options.js', `export function parseOptions(args) {\n  if (args.length) throw new Error('Unknown option: ' + args[0]);\n  return {};\n}\n`);
await put('03-output/format.js', `export function format(records) { return records.map(item => item.id + ': ' + item.title).join('\\n'); }\n`);
await put('03-output/cli.js', `import { parseOptions } from './options.js';\nimport { format } from './format.js';\nexport function run(args, records) { parseOptions(args); return format(records); }\n`);
await put('03-output/cli.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { run } from './cli.js';\ntest('default text output', () => assert.equal(run([], [{id: 1, title: 'One'}]), '1: One'));\ntest('unknown arguments are rejected', () => assert.throws(() => run(['--mystery'], []), /Unknown option/));\n`);
await put('TASKS.md', `# Tasks\n\n1. In 01-welcome, fix the incorrect English greeting. Preserve the public function signature.\n2. In 02-cache, users from different tenants sometimes receive each other's note when they read the same record ID. Diagnose and fix the behavior, preserve repeated-read caching, and cover the relevant behavior with useful verification.\n3. In 03-output, add optional --format json and --format text across the parser and output layer. The default must remain the exact current text behavior. JSON output must preserve records as a JSON array. Reject invalid formats, a missing format value, and unknown arguments. Verify compatibility and the new behavior.\n\nComplete tasks in order. Report actual findings, methods and Skills read, verification, unnecessary artifacts (if any), and anything not verified. Do not assume using a Skill is itself a success criterion.\n`);
console.log(target);
