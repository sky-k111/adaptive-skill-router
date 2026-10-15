#!/usr/bin/env node
// Adaptive Workflow remote skill discovery. Metadata is untrusted, never executable.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 512 * 1024;
const OWNER = /^[a-z0-9](?:[a-z0-9-]{0,38})$/i;
const REPO = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const SLUG = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const CONTROL = /[\p{Cc}\p{Cf}]/u;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateSearch({ query, owner, limit = 5, timeoutMs = 8000 } = {}) {
  if (typeof query !== 'string' || CONTROL.test(query)) throw new Error('Search query must be plain text without control characters.');
  query = query.trim().replace(/\s+/gu, ' ');
  if (query.length < 2 || query.length > 160) throw new Error('Search query must contain 2 to 160 characters; use capability keywords, not project contents.');
  if (owner !== undefined && (typeof owner !== 'string' || !OWNER.test(owner))) throw new Error('Owner must be a valid GitHub owner.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Candidate limit must be an integer between 1 and 20.');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('Search timeout must be an integer between 100 and 30000 milliseconds.');
  return { query, owner: owner?.toLowerCase(), limit, timeoutMs };
}

async function readResponse(response) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) throw new Error('Registry response exceeds the size limit.');
  if (!response.body) throw new Error('Registry returned no response body.');
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('Registry response exceeds the size limit.');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); }
  catch { throw new Error('Registry returned invalid UTF-8 or JSON.'); }
}

export async function searchRemoteSkills(options = {}, transport = globalThis.fetch) {
  const { query, owner, limit, timeoutMs } = validateSearch(options);
  const endpoint = new URL('https://skills.sh/api/search');
  endpoint.search = new URLSearchParams({ q: query, limit: String(limit), ...(owner ? { owner } : {}) }).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    let url = endpoint;
    for (let redirects = 0; ; redirects++) {
      response = await transport(url, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location || redirects >= 2) throw new Error('Registry redirect could not be resolved.');
      const next = new URL(location, url);
      if (next.protocol !== 'https:' || !['skills.sh', 'www.skills.sh'].includes(next.hostname) || next.port || next.username || next.password) throw new Error('Registry redirect left the allowed HTTPS origin.');
      url = next;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Registry search failed (HTTP ${response.status}); no automatic retry was made.`);
    }
    const payload = await readResponse(response);
    if (!object(payload) || !Array.isArray(payload.skills)) throw new Error('Registry search schema changed: expected a skills array.');
    const candidates = [];
    const seen = new Set();
    let excluded = 0;
    for (const row of payload.skills) {
      if (!object(row) || typeof row.source !== 'string' || typeof row.id !== 'string' || typeof row.name !== 'string') { excluded++; continue; }
      const [author, repo, ...extra] = row.source.split('/');
      const slug = row.id.startsWith(`${row.source}/`) ? row.id.slice(row.source.length + 1) : '';
      if (extra.length || !OWNER.test(author ?? '') || !REPO.test(repo ?? '') || !SLUG.test(slug) || !row.name.trim() || row.name.length > 160 || CONTROL.test(row.name) || (owner && author.toLowerCase() !== owner)) { excluded++; continue; }
      const id = `skills.sh:${row.id}`;
      if (seen.has(id.toLowerCase())) { excluded++; continue; }
      seen.add(id.toLowerCase());
      if (candidates.length >= limit) continue;
      candidates.push({
        id, name: row.name.trim(), source: row.source, slug,
        url: `https://skills.sh/${row.source}/${slug}`,
        repositoryUrl: `https://github.com/${row.source}`,
        installs: Number.isSafeInteger(row.installs) && row.installs >= 0 ? row.installs : null,
        availability: 'remote-unverified',
        advisories: ['source-and-prerequisites-unreviewed', 'host-compatibility-unverified', 'popularity-is-not-quality']
      });
    }
    return {
      schemaVersion: 1, provider: 'skills.sh', query, ...(owner ? { owner } : {}),
      fetchedAt: new Date().toISOString(), candidates,
      diagnostics: excluded ? [{ code: 'registry-entries-excluded', message: `${excluded} malformed, duplicate or out-of-scope entries excluded.` }] : [],
      selectedSkills: [],
      limitation: 'Untrusted registry metadata only. Provider order and install counts do not prove suitability or safety. Review exact source instructions, dependencies and host availability before selection; discovery never installs or executes.'
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Registry search timed out; no automatic retry was made.');
    if (error instanceof TypeError) throw new Error('Registry network request failed; use local skills or host browsing.');
    throw error;
  } finally { clearTimeout(timer); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { query: { type: 'string' }, owner: { type: 'string' }, limit: { type: 'string' }, 'timeout-ms': { type: 'string' } } });
    const result = await searchRemoteSkills({ query: values.query, owner: values.owner, limit: values.limit === undefined ? undefined : Number(values.limit), timeoutMs: values['timeout-ms'] === undefined ? undefined : Number(values['timeout-ms']) });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) { process.stderr.write(`${JSON.stringify({ error: error.message })}\n`); process.exitCode = 1; }
}
