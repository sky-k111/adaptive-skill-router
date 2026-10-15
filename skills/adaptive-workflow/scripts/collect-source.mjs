#!/usr/bin/env node
// Adaptive Workflow source collection. Fetched instructions are data, never executed.
import { createHash } from 'node:crypto';
import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { configureCliProxy } from './search-skills.mjs';

const SHA = /^[a-f0-9]{40}$/;
const CONTROL = /[\p{Cc}\p{Cf}]/u;
const FILE_BYTES = 128 * 1024;
const TOTAL_BYTES = 1024 * 1024;
const MAX_FILES = 16;
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function safePath(value) {
  if (typeof value !== 'string' || !value || value.length > 400 || CONTROL.test(value) || /[\\?#%:]/.test(value) || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Use an exact repository-relative path without traversal, escapes or URL syntax.');
  return value;
}

export function validateSource({ source, path, skill, ref = 'HEAD', include = [], timeoutMs = 30000 } = {}) {
  if (typeof source !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,38})\/[a-z0-9][a-z0-9._-]{0,99}$/i.test(source)) throw new Error('Source must be a GitHub owner/repository.');
  if ((path === undefined) === (skill === undefined)) throw new Error('Provide one exact SKILL.md path or one skill directory slug.');
  if (path !== undefined && !/(^|\/)SKILL\.md$/.test(safePath(path))) throw new Error('Source path must end in SKILL.md.');
  if (skill !== undefined && (typeof skill !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(skill))) throw new Error('Invalid skill directory slug.');
  if (typeof ref !== 'string' || !ref || ref.length > 160 || CONTROL.test(ref) || /[\\?#%:]/.test(ref)) throw new Error('Invalid Git ref.');
  if (!Array.isArray(include) || include.length > 8) throw new Error('At most eight explicit supporting paths are supported.');
  include.forEach(safePath);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw new Error('Source timeout must be 100 to 60000 milliseconds.');
  return { source, path, skill, ref, include, timeoutMs };
}

async function responseJson(response, maxBytes) {
  if (!response.body) throw new Error('GitHub returned no response body.');
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) { await response.body.cancel().catch(() => {}); throw new Error('GitHub response exceeds the size limit.'); }
  const reader = response.body.getReader(), chunks = [];
  let bytes = 0;
  try {
    while (true) {
      let chunk;
      try { chunk = await reader.read(); } catch { throw new Error('GitHub response could not be read.'); }
      const { value, done } = chunk;
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('GitHub response exceeds the size limit.');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); }
  catch { throw new Error('GitHub returned invalid UTF-8 or JSON.'); }
}

// This intentionally recognizes bounded local Markdown links and literal resource
// paths, not arbitrary natural-language obligations or shell-generated paths.
function references(content, from) {
  const found = new Set();
  for (const match of content.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)|^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?|`((?:\.{1,2}\/)?(?:references|scripts|assets)\/[^`\s]+)`/gm)) {
    let target = match[1] ?? match[2] ?? match[3];
    if (target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    target = target.split('#')[0];
    if (!target) continue;
    try { target = decodeURIComponent(target); } catch { found.add('!invalid-link'); continue; }
    if (target.startsWith('/') || target.includes('\\') || CONTROL.test(target)) { found.add('!outside-or-invalid-link'); continue; }
    const resolved = posix.normalize(posix.join(posix.dirname(from), target));
    try { found.add(safePath(resolved)); } catch { found.add('!outside-or-invalid-link'); }
  }
  return [...found];
}

export async function collectSkillSource(options, transport = globalThis.fetch) {
  const { source, path, skill, ref, include, timeoutMs } = validateSource(options);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
  let retried = false;
  const request = async (suffix, maxBytes) => {
    const url = `https://api.github.com/repos/${source}/${suffix}`;
    let response;
    const init = { redirect: 'manual', signal: controller.signal, headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'adaptive-skill-router', 'X-GitHub-Api-Version': '2026-03-10' } };
    try { response = await transport(url, init); }
    catch (error) {
      if (!(error instanceof TypeError) || retried || controller.signal.aborted) throw new Error('source-network-failed');
      retried = true;
      try { response = await transport(url, init); } catch { throw new Error('source-network-failed'); }
    }
    if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error(`GitHub source request failed (HTTP ${response.status}); redirects and HTTP errors are not retried.`); }
    return responseJson(response, maxBytes);
  };
  const reason = error => controller.signal.aborted ? 'source-deadline-exhausted' : error instanceof TypeError ? 'source-network-failed' : error.message;
  try {
    const commit = await request(`commits/${encodeURIComponent(ref)}`, 512 * 1024);
    if (!object(commit) || !SHA.test(commit.sha) || !SHA.test(commit.commit?.tree?.sha) || (SHA.test(ref) && commit.sha !== ref)) throw new Error('GitHub commit identity is missing or mismatched.');
    const tree = await request(`git/trees/${commit.commit.tree.sha}?recursive=1`, 4 * 1024 * 1024);
    if (!object(tree) || tree.sha !== commit.commit.tree.sha || tree.truncated !== false || !Array.isArray(tree.tree) || tree.tree.length > 20000) throw new Error('GitHub tree is incomplete or invalid; no complete source collection can be claimed.');
    const entries = new Map();
    for (const entry of tree.tree) {
      if (!object(entry) || typeof entry.path !== 'string') throw new Error('GitHub tree entry is invalid.');
      safePath(entry.path);
      if (entries.has(entry.path)) throw new Error('GitHub tree contains duplicate paths.');
      entries.set(entry.path, entry);
    }
    const matches = path ? [path] : [...entries.keys()].filter(p => p.endsWith('/SKILL.md') && posix.basename(posix.dirname(p)) === skill);
    if (matches.length !== 1) throw new Error(`Skill directory slug resolves to ${matches.length} manifests; supply an exact --path.`);
    const manifest = matches[0], directory = posix.dirname(manifest);
    const queue = [{ path: manifest, role: 'instructions', depth: 0 }];
    const metadata = posix.join(directory, 'agents/openai.yaml');
    if (entries.has(metadata)) queue.push({ path: metadata, role: 'invocation-metadata', depth: 0 });
    const licenses = [...entries.keys()].filter(p => /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/i.test(posix.basename(p)) && (posix.dirname(p) === '.' || directory === posix.dirname(p) || directory.startsWith(`${posix.dirname(p)}/`)));
    for (const p of licenses) queue.push({ path: p, role: 'license', depth: 0 });
    for (const p of include) queue.push({ path: p, role: 'explicit-support', depth: 0 });
    const files = [], unresolved = [], seen = new Set();
    let total = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      const entry = entries.get(item.path);
      if (!entry) { unresolved.push({ path: item.path, reason: 'not-found' }); continue; }
      if (entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode) || !SHA.test(entry.sha)) { unresolved.push({ path: item.path, reason: 'not-a-regular-file' }); continue; }
      if (!Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > FILE_BYTES || total + entry.size > TOTAL_BYTES || files.length >= MAX_FILES) { unresolved.push({ path: item.path, reason: 'collection-budget-exceeded' }); continue; }
      try {
        const blob = await request(`git/blobs/${entry.sha}`, 256 * 1024);
        if (!object(blob) || blob.sha !== entry.sha || blob.encoding !== 'base64' || typeof blob.content !== 'string' || !/^[A-Za-z0-9+/=\r\n]*$/.test(blob.content)) throw new Error('Invalid Git blob response.');
        const bytes = Buffer.from(blob.content, 'base64');
        if (bytes.length !== entry.size || blob.size !== entry.size || bytes.length > FILE_BYTES || hash('sha1', Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])) !== entry.sha) throw new Error('Git blob content does not match the pinned tree.');
        const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        if (content.includes('\0')) throw new Error('Binary content requires separate host inspection.');
        total += bytes.length;
        files.push({ path: item.path, role: item.role, gitBlobSha: entry.sha, sha256: hash('sha256', bytes), url: `https://github.com/${source}/blob/${commit.sha}/${item.path.split('/').map(encodeURIComponent).join('/')}`, content });
        if (/\.(?:md|mdx|markdown)$/i.test(item.path)) for (const p of references(content, item.path)) {
          if (p.startsWith('!')) unresolved.push({ path: item.path, reason: p.slice(1) });
          else if (!seen.has(p)) {
            if (item.depth >= 2) unresolved.push({ path: p, reason: 'reference-depth-limit' });
            else if (queue.length >= 128) unresolved.push({ path: p, reason: 'reference-count-limit' });
            else queue.push({ path: p, role: 'support', depth: item.depth + 1 });
          }
        }
      } catch (error) { unresolved.push({ path: item.path, reason: reason(error) }); }
    }
    if (!licenses.length) unresolved.push({ path: directory, reason: 'license-not-found' });
    return { schemaVersion: 1, source, requestedRef: ref, commit: commit.sha, manifest,
      status: unresolved.length || !files.some(file => file.role === 'instructions') ? 'incomplete' : 'complete',
      reviewStatus: 'not-reviewed', files, unresolved, connectionRetried: retried, selectedSkills: [],
      coverage: 'Entry, optional invocation metadata, ancestor licenses, explicit support and bounded literal local references. External links, natural-language dependencies, host availability and license interpretation require host review. Nothing was installed or executed. Git hashes are integrity checks, not publisher authentication.' };
  } catch (error) { throw new Error(reason(error)); }
  finally { clearTimeout(timer); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let restore = () => {};
  try {
    const { values } = parseArgs({ options: { source: { type: 'string' }, path: { type: 'string' }, skill: { type: 'string' }, ref: { type: 'string' }, include: { type: 'string', multiple: true }, proxy: { type: 'string' }, 'timeout-ms': { type: 'string' } } });
    const options = validateSource({ source: values.source, path: values.path, skill: values.skill, ref: values.ref, include: values.include, timeoutMs: values['timeout-ms'] === undefined ? undefined : Number(values['timeout-ms']) });
    restore = configureCliProxy(values.proxy ?? process.env.ASR_HTTPS_PROXY);
    const result = await collectSkillSource(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'complete') process.exitCode = 2;
  } catch (error) { process.stderr.write(`${JSON.stringify({ error: error.message })}\n`); process.exitCode = 1; }
  finally { restore(); }
}
