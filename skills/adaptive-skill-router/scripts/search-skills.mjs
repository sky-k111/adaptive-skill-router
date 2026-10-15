#!/usr/bin/env node
// Adaptive Workflow remote skill discovery. Metadata is untrusted, never executable.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as http from 'node:http';

const MAX_BYTES = 512 * 1024;
const OWNER = /^[a-z0-9](?:[a-z0-9-]{0,38})$/i;
const REPO = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const SLUG = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const CONTROL = /[\p{Cc}\p{Cf}]/u;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const STOP_WORDS = new Set('a an and are as at be been before by can do for from has have if in is it its of on or our that the their then these this to use used using was we when where which with you your'.split(' '));

export function metadataTokens(text) {
  const normalized = text.toLowerCase().replace(/\bnode(?:\.js|js)\b/g, 'node');
  const words = normalized.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  const out = new Set(words.flatMap(word => [word, ...word.split('-')]).filter(word => !STOP_WORDS.has(word)));
  for (const group of normalized.match(/[\p{Script=Han}]+/gu) ?? []) {
    if (group.length === 1) out.add(group);
    for (let i = 0; i < group.length - 1; i++) out.add(group.slice(i, i + 2));
  }
  return out;
}

export function validateConstraints({ requiredTerms = [], excludedTerms = [] } = {}) {
  for (const terms of [requiredTerms, excludedTerms]) {
    if (!Array.isArray(terms) || terms.length > 8 || terms.some(term => typeof term !== 'string' || !term.trim() || term.length > 80 || CONTROL.test(term) || !metadataTokens(term).size)) throw new Error('Constraints must be arrays of up to eight non-empty capability terms (80 characters each).');
  }
  return { requiredTerms: [...new Set(requiredTerms.map(s => s.trim()))], excludedTerms: [...new Set(excludedTerms.map(s => s.trim()))] };
}

export function relevanceSignals(query, name, description = '', constraints = {}) {
  const { requiredTerms, excludedTerms } = validateConstraints(constraints);
  const tokens = metadataTokens(query), title = metadataTokens(name), text = metadataTokens(`${name} ${description}`);
  const matchedTerms = [...tokens].filter(term => text.has(term));
  const matches = term => [...metadataTokens(term)].every(word => text.has(word));
  const missingRequiredTerms = requiredTerms.filter(term => !matches(term));
  const matchedExcludedTerms = excludedTerms.filter(matches);
  const queryCoverage = tokens.size ? matchedTerms.length / tokens.size : 0;
  return { matchedTerms, queryCoverage, missingRequiredTerms, matchedExcludedTerms,
    retrievalScore: Math.round(queryCoverage * 1000) + matchedTerms.filter(term => title.has(term)).length,
    matchesConstraints: !missingRequiredTerms.length && !matchedExcludedTerms.length };
}

// CLI entry points only: do not implicitly replace a library caller's dispatcher.
export function configureCliProxy(proxy) {
  if (proxy === undefined) return () => {};
  let url;
  try { url = new URL(proxy); } catch { throw new Error('Proxy must be an HTTP(S) URL without credentials, path, query or fragment.'); }
  if (typeof proxy !== 'string' || proxy.length > 512 || CONTROL.test(proxy) || !['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Proxy must be an HTTP(S) URL without credentials, path, query or fragment.');
  if (typeof http.setGlobalProxyFromEnv !== 'function') throw new Error('Explicit proxy support requires Node.js 24.14+; alternatively start a compatible Node.js with --use-env-proxy and HTTPS_PROXY.');
  return http.setGlobalProxyFromEnv({ HTTP_PROXY: url.href, HTTPS_PROXY: url.href });
}

export function validateSearch({ query, owner, limit = 5, timeoutMs = 8000, requiredTerms, excludedTerms } = {}) {
  if (typeof query !== 'string' || CONTROL.test(query)) throw new Error('Search query must be plain text without control characters.');
  query = query.trim().replace(/\s+/gu, ' ');
  if (query.length < 2 || query.length > 160) throw new Error('Search query must contain 2 to 160 characters; use capability keywords, not project contents.');
  if (owner !== undefined && (typeof owner !== 'string' || !OWNER.test(owner))) throw new Error('Owner must be a valid GitHub owner.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Candidate limit must be an integer between 1 and 20.');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('Search timeout must be an integer between 100 and 30000 milliseconds.');
  return { query, owner: owner?.toLowerCase(), limit, timeoutMs, ...validateConstraints({ requiredTerms, excludedTerms }) };
}

async function readResponse(response) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    await response.body?.cancel().catch(() => {});
    throw new Error('Registry response exceeds the size limit.');
  }
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
  const { query, owner, limit, timeoutMs, requiredTerms, excludedTerms } = validateSearch(options);
  const endpoint = new URL('https://skills.sh/api/search');
  endpoint.search = new URLSearchParams({ q: query, limit: String(limit), ...(owner ? { owner } : {}) }).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let connectionRetries = 0;
  try {
    let url = endpoint;
    for (let redirects = 0; ; redirects++) {
      try {
        response = await transport(url, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } });
      } catch (error) {
        // One extra connection attempt, sharing the original total timeout.
        // HTTP errors and response/schema failures are never retried.
        if (!(error instanceof TypeError) || controller.signal.aborted || connectionRetries) throw error;
        connectionRetries++;
        response = await transport(url, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } });
      }
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
      throw new Error(`Registry search failed (HTTP ${response.status}); the HTTP response was not retried.`);
    }
    const payload = await readResponse(response);
    if (!object(payload) || !Array.isArray(payload.skills)) throw new Error('Registry search schema changed: expected a skills array.');
    const candidates = [];
    const seen = new Set();
    let excluded = 0;
    for (const [providerIndex, row] of payload.skills.entries()) {
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
        providerRank: providerIndex + 1,
        relevance: relevanceSignals(query, row.name, '', { requiredTerms, excludedTerms }),
        advisories: ['source-and-prerequisites-unreviewed', 'host-compatibility-unverified', 'popularity-is-not-quality']
      });
    }
    const filteredCandidates = candidates.filter(candidate => !candidate.relevance.matchesConstraints);
    const ranked = candidates.filter(candidate => candidate.relevance.matchesConstraints).sort((a, b) => b.relevance.retrievalScore - a.relevance.retrievalScore || a.providerRank - b.providerRank);
    return {
      schemaVersion: 1, provider: 'skills.sh', query, ...(owner ? { owner } : {}),
      fetchedAt: new Date().toISOString(), candidates: ranked, filteredCandidates,
      diagnostics: [
        ...(excluded ? [{ code: 'registry-entries-excluded', message: `${excluded} malformed, duplicate or out-of-scope entries excluded.` }] : []),
        ...(connectionRetries ? [{ code: 'registry-connection-retried', message: 'One failed connection attempt was retried within the original timeout.' }] : [])
      ],
      selectedSkills: [],
      limitation: 'Lexical reranking of this bounded registry response, not semantic selection. Constraints apply only to supplied metadata; low overlap is not proof of irrelevance. Popularity is not quality. Review source instructions, dependencies and host availability; nothing is installed or executed.'
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Registry search timed out; the total deadline was exhausted.');
    if (error instanceof TypeError) throw new Error('Registry network request failed; check the network or configure a trusted proxy with --proxy / ASR_HTTPS_PROXY. Local skills and host browsing remain alternatives.');
    throw error;
  } finally { clearTimeout(timer); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let restore = () => {};
  try {
    const { values } = parseArgs({ options: { query: { type: 'string' }, owner: { type: 'string' }, limit: { type: 'string' }, 'timeout-ms': { type: 'string' }, proxy: { type: 'string' }, require: { type: 'string', multiple: true }, exclude: { type: 'string', multiple: true } } });
    const options = validateSearch({ query: values.query, owner: values.owner, limit: values.limit === undefined ? undefined : Number(values.limit), timeoutMs: values['timeout-ms'] === undefined ? undefined : Number(values['timeout-ms']), requiredTerms: values.require, excludedTerms: values.exclude });
    restore = configureCliProxy(values.proxy ?? process.env.ASR_HTTPS_PROXY);
    const result = await searchRemoteSkills(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) { process.stderr.write(`${JSON.stringify({ error: error.message })}\n`); process.exitCode = 1; }
  finally { restore(); }
}
