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
await put('AGENTS.md', '# Streaming investigation\n\nWork only in this sandbox. Keep router source, other sandboxes and global configuration read-only. No publishing, deployments, installations or subagents. Use Node built-ins and proportionate verification. Do not read evaluator-owned checks or previous answers.\n');
await writeIntegration(target, await planIntegration(target));
await put('package.json', '{"type":"module","scripts":{"test":"node --test importer.test.js"}}\n');
await put('importer.js', `export async function importRecords(chunks) {
  const records = [], errors = [];
  let remaining = '', line = 0;
  for await (const chunk of chunks) {
    remaining += Buffer.from(chunk).toString('utf8');
    const parts = remaining.split('\\n');
    remaining = parts.pop();
    for (const part of parts) {
      line++;
      if (!part) continue;
      try { records.push(JSON.parse(part)); }
      catch (error) { errors.push({ line, message: error.message }); }
    }
  }
  return { records, errors };
}
`);
await put('importer.test.js', `import test from 'node:test';
import assert from 'node:assert/strict';
import { importRecords } from './importer.js';
test('ASCII rows terminated with LF', async () => {
  assert.deepEqual(await importRecords([Buffer.from('{"id":"one"}\\n')]), { records: [{ id: 'one' }], errors: [] });
});
`);
await put('TASK.md', `# First request

Repair importRecords(chunks) in importer.js. Valid Unicode IDs are occasionally corrupted when imported, and some exports lose their last record. The public API returns a Promise for { records, errors } and accepts a sync or async iterable of Uint8Array chunks representing UTF-8 JSON Lines. Each nonblank physical line contains a JSON value. Preserve order and all JSON values, including null and scalar values. Report syntax errors as { line, message } with one-based physical line numbers and a nonempty string message, then continue to later lines.

Support arbitrary byte boundaries, empty chunks, LF/CRLF, whitespace-only blank lines, an optional initial UTF-8 BOM, and a final line without LF. Ignore blank lines without changing physical error numbering. Separate concurrent invocations must not share state. Reject with the original source error if its iterator fails. Do not mutate input chunks.

For this first request, malformed UTF-8 bytes use replacement characters, consistent with nonfatal UTF-8 decoding; a resulting valid JSON value is accepted. No strict-decoding option is requested in this phase.

Investigate code and current checks before deciding methods. Verify behavior without sleep-based scheduling. Save key raw test output in work/ and report observed causes, methods/Skills actually read, checks, extra artifacts and limits in PHASE-1.md. Stop after satisfying this request. Do not invent additional framework or product work.
`);
console.log(target);
