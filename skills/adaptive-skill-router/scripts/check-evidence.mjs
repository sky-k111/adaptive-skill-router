#!/usr/bin/env node
// Adaptive Workflow evidence record.
// A file-state snapshot is continuity evidence, never proof that tests passed.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readlink, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const format = 'adaptive-workflow-file-state-v1';
const maxRecordBytes = 1024 * 1024;

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative !== '' && !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

function relativeFile(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.includes('\\') || path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || value.includes(':')) {
    throw new Error('File selections must be non-empty relative paths using forward slashes.');
  }
  if (value.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('File selections cannot contain empty, dot or parent segments.');
  return value;
}

async function canonicalRoot(root) {
  if (typeof root !== 'string' || !root) throw new Error('--root is required.');
  const resolved = await realpath(root);
  if (!(await stat(resolved)).isDirectory()) throw new Error('The project root must be a directory.');
  return resolved;
}

async function boundFile(root, filename) {
  const selection = relativeFile(filename);
  let component = root;
  for (const part of selection.split('/')) {
    component = path.join(component, part);
    if ((await lstat(component)).isSymbolicLink()) {
      const target = path.resolve(path.dirname(component), await readlink(component));
      let actual;
      try { actual = await realpath(component); }
      catch (error) {
        // Canonicalize the nearest existing ancestor of a dangling target.
        // System aliases (such as /var -> /private/var) are not project escapes.
        let ancestor = target;
        const suffix = [];
        while (true) {
          try { actual = path.join(await realpath(ancestor), ...suffix); break; }
          catch (ancestorError) {
            if (ancestorError.code !== 'ENOENT' || path.dirname(ancestor) === ancestor) throw ancestorError;
            suffix.unshift(path.basename(ancestor));
            ancestor = path.dirname(ancestor);
          }
        }
        if (actual !== root && !inside(root, actual)) throw new Error(`Selected link points outside the project root: ${filename}`);
        throw error;
      }
      if (actual !== root && !inside(root, actual)) throw new Error(`Selected link resolves outside the project root: ${filename}`);
    }
  }
  const resolved = await realpath(path.join(root, selection));
  if (!inside(root, resolved)) throw new Error(`Selected file resolves outside the project root: ${filename}`);
  if (!(await stat(resolved)).isFile()) throw new Error(`Selected path must be a regular file: ${filename}`);
  return resolved;
}

async function digest(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function boundRecordPath(root, input, writing) {
  if (typeof input !== 'string' || !input) throw new Error(writing ? '--output is required.' : '--record is required.');
  const filename = path.resolve(root, input);
  const parent = await realpath(path.dirname(filename));
  if (parent !== root && !inside(root, parent)) throw new Error('The record path must be inside the project root; its parent resolves outside the project root.');
  if (!writing) {
    const resolved = await realpath(filename);
    if (!inside(root, resolved)) throw new Error('The record resolves outside the project root.');
    if (!(await stat(resolved)).isFile()) throw new Error('The record must be a regular file.');
    return resolved;
  }
  // Windows exclusive creation can follow a dangling file symlink. Check the
  // entry itself before writing; exclusive creation also rejects ordinary races.
  const destination = path.join(parent, path.basename(filename));
  try {
    await lstat(destination);
    throw Object.assign(new Error('The output record already exists.'), { code: 'EEXIST' });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return destination;
}

export async function capture({ root, output, files }) {
  const projectRoot = await canonicalRoot(root);
  if (!Array.isArray(files) || files.length === 0) throw new Error('Select at least one project file explicitly.');
  const selections = files.map(relativeFile);
  if (new Set(selections).size !== selections.length) throw new Error('Duplicate file selections are not allowed.');
  const destination = await boundRecordPath(projectRoot, output, true);
  const entries = [];
  for (const selection of selections) {
    const resolved = await boundFile(projectRoot, selection);
    if (resolved === destination) throw new Error('The record cannot select itself.');
    entries.push({ path: selection, resolvedPath: path.relative(projectRoot, resolved).split(path.sep).join('/'), sha256: await digest(resolved) });
  }
  const record = { format, root: projectRoot, createdAt: new Date().toISOString(), files: entries };
  const serialized = `${JSON.stringify(record, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > maxRecordBytes) throw new Error('The selected file list exceeds the record size limit.');
  await writeFile(destination, serialized, { flag: 'wx', mode: 0o600 });
  return { record: destination, selectedFiles: entries.length, meaning: 'Selected file state only; no verification result is asserted.' };
}

function validateRecord(record, root) {
  if (!record || record.format !== format || record.root !== root || !Array.isArray(record.files) || !record.files.length || typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))) {
    throw new Error('Invalid record or project root mismatch.');
  }
  const seen = new Set();
  for (const entry of record.files) {
    if (!entry || typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid file entry or SHA256 in record.');
    relativeFile(entry.path);
    relativeFile(entry.resolvedPath);
    if (seen.has(entry.path)) throw new Error('Duplicate paths in record.');
    seen.add(entry.path);
  }
}

export async function check({ root, record }) {
  const projectRoot = await canonicalRoot(root);
  const filename = await boundRecordPath(projectRoot, record, false);
  if ((await stat(filename)).size > maxRecordBytes) throw new Error('Record exceeds the size limit.');
  let snapshot;
  try { snapshot = JSON.parse(await readFile(filename, 'utf8')); }
  catch { throw new Error('Record is not valid JSON.'); }
  validateRecord(snapshot, projectRoot);
  const files = [];
  for (const entry of snapshot.files) {
    let resolved;
    try { resolved = await boundFile(projectRoot, entry.path); }
    catch (error) {
      if (error.code === 'ENOENT') { files.push({ path: entry.path, status: 'missing' }); continue; }
      throw error;
    }
    const resolvedPath = path.relative(projectRoot, resolved).split(path.sep).join('/');
    const sha256 = await digest(resolved);
    files.push({ path: entry.path, status: sha256 === entry.sha256 && resolvedPath === entry.resolvedPath ? 'unchanged' : 'changed' });
  }
  return { createdAt: snapshot.createdAt, files, meaning: 'Unchanged file state does not establish correct behavior or passing tests.' };
}

export async function runCli(args) {
  const [command, ...rest] = args;
  if (!['capture', 'check'].includes(command)) throw new Error('Usage: capture --root PATH --output PATH relative-file [...] | check --root PATH --record PATH');
  const options = {};
  const files = [];
  for (let index = 0; index < rest.length; index++) {
    const token = rest[index];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (!['root', command === 'capture' ? 'output' : 'record'].includes(key) || key in options || !rest[index + 1] || rest[index + 1].startsWith('--')) throw new Error(`Invalid or duplicate option: ${token}`);
      options[key] = rest[++index];
    } else files.push(token);
  }
  if (command === 'check' && files.length) throw new Error('check does not accept file selections.');
  const result = command === 'capture' ? await capture({ ...options, files }) : await check(options);
  return { result, exitCode: command === 'check' && result.files.some(file => file.status !== 'unchanged') ? 1 : 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { result, exitCode } = await runCli(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 2;
  }
}
