import type { Candidate, Catalog, Decision, Evidence, Host, Method, Skill } from './types.js';
import { metadataTokens as tokens } from './retrieval.js';

const LIMITATION = 'Evidence-based workflow advice, not an execution or authorization engine. Retrieval scores rank metadata matches, not quality or certainty. Codex makes the final semantic choice after inspecting a candidate.';
const STRINGS = ['findings', 'unknowns'] as const;
const FLAGS = ['rootCauseKnown', 'requirementsClear', 'verificationReady', 'regressionRisk', 'stalled', 'destructive', 'production', 'needsDomainKnowledge', 'coordinationNeeded'] as const;

export function validateEvidence(value: unknown, task: string): Evidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Evidence must be an object.');
  const data = value as Record<string, unknown>;
  if (data.task !== task) throw new Error('Evidence.task must exactly match the task being routed; do not reuse stale evidence.');
  if (typeof data.explored !== 'boolean') throw new Error('Evidence.explored must be a boolean.');
  for (const key of STRINGS) {
    if (!Array.isArray(data[key]) || data[key].some(v => typeof v !== 'string' || !v.trim())) throw new Error(`Evidence.${key} must be an array of non-empty strings.`);
  }
  if (typeof data.scope !== 'string' || !['local', 'cross-module', 'unknown'].includes(data.scope)) throw new Error('Evidence.scope is invalid.');
  if (typeof data.risk !== 'string' || !['low', 'medium', 'high', 'unknown'].includes(data.risk)) throw new Error('Evidence.risk is invalid.');
  for (const key of FLAGS) {
    if (data[key] !== undefined && typeof data[key] !== 'boolean') throw new Error(`Evidence.${key} must be a boolean.`);
  }
  if (data.explored && (data.findings as string[]).length === 0) throw new Error('Explored evidence must contain at least one finding.');
  return data as unknown as Evidence;
}

function shortlist(task: string, catalog: Catalog, gaps: Method[], limit: number, requested: string[]): Candidate[] {
  const query = tokens(task);
  const explicit = new Set<string>();
  for (const selector of requested) {
    const matches = catalog.skills.filter(s => s.id === selector || s.path === selector || s.name === selector);
    if (matches.length !== 1) throw new Error(`Requested skill is missing or ambiguous: ${selector}. Use its exact id.`);
    const skill = matches[0]!;
    if (skill.disabled || skill.availability !== 'discovered') throw new Error(`Requested skill is disabled or has unverified plugin enablement: ${selector}.`);
    explicit.add(skill.id);
  }
  return catalog.skills.flatMap(skill => {
    const userRequested = explicit.has(skill.id);
    if (skill.disabled || skill.availability !== 'discovered' || (!skill.automatic && !userRequested)) return [];
    if (['adaptive-skill-router', 'adaptive-workflow'].includes(skill.name) && !userRequested) return [];
    const matchedMethods = skill.methods.filter(method => gaps.includes(method));
    if (!matchedMethods.length && !userRequested) return [];
    const words = tokens(`${skill.name} ${skill.description}`);
    const matches = [...query].filter(t => words.has(t));
    // A small bilingual retrieval heuristic; semantic judgment stays in the host.
    const methodMatch = matchedMethods.some(m => m !== 'domain');
    if (!methodMatch && matches.length === 0 && !userRequested) return [];
    const score = matches.length + (methodMatch ? 3 : 0) + (userRequested ? 1000 : 0);
    const reasons = userRequested ? ['Explicitly requested by the user.'] : matchedMethods.map(m => `May help the observed ${m} gap.`);
    if (matches.length) reasons.push(`Metadata overlaps: ${matches.slice(0, 6).join(', ')}.`);
    return [{ id: skill.id, name: skill.name, path: skill.path, inspectionFingerprint: skill.inspectionFingerprint, description: skill.description,
      methods: skill.methods, reasons, estimatedBodyTokens: skill.estimatedBodyTokens,
      advisories: skill.advisories, retrievalScore: score }];
  }).sort((a, b) => b.retrievalScore - a.retrievalScore || a.estimatedBodyTokens - b.estimatedBodyTokens || a.id.localeCompare(b.id)).slice(0, limit);
}

export interface RouteOptions { evidence?: unknown; host?: Host; limit?: number; requestedSkills?: string[] }
export function routeTask(task: string, catalog: Catalog, options: RouteOptions = {}): Decision {
  if (!task.trim()) throw new Error('A non-empty task is required.');
  const limit = options.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Candidate limit must be an integer between 1 and 20.');
  const evidence = options.evidence === undefined ? undefined : validateEvidence(options.evidence, task);
  const requested = options.requestedSkills ?? [];
  const base = {
    schemaVersion: 1 as const, host: 'codex' as const, selectedSkills: [] as never[],
    approvalCheckRequired: evidence?.production === true || evidence?.destructive === true,
    verification: 'Verify the requested result with checks proportionate to the observed risk; obey required project checks and disclose unrun checks.',
    limitation: LIMITATION
  };
  if (requested.length) return { ...base, action: 'consider-skills', reasons: ['Honor the explicit skill choice; inspect its prerequisites and invocation chain before proceeding.'], gaps: [], candidates: shortlist(task, catalog, [], limit, requested) };
  if (!evidence?.explored) return { ...base, action: 'explore', reasons: ['No task-bound exploration evidence yet. Inspect relevant code and existing checks before adding workflow.'], gaps: [], candidates: [] };
  if ((evidence.scope === 'unknown' || evidence.risk === 'unknown') && !evidence.stalled) return { ...base, action: 'explore', reasons: ['Impact or risk remains unknown. Collect the specific evidence needed to choose a method.'], gaps: [], candidates: [] };
  const gaps: Method[] = [];
  const reasons: string[] = [];
  const add = (method: Method, reason: string) => { if (!gaps.includes(method)) gaps.push(method); reasons.push(reason); };
  if (evidence.rootCauseKnown === false || evidence.stalled) add('debug', 'Root cause remains unproven or exploration stopped producing evidence.');
  if (evidence.requirementsClear === false || evidence.coordinationNeeded === true) add('plan', 'Observed requirements or interface dependencies need coordination beyond a direct edit.');
  if (evidence.verificationReady === false || evidence.regressionRisk) add('test', 'Existing verification is insufficient or behavior has material regression risk.');
  if (evidence.risk === 'high') add('review', 'High consequence changes warrant additional review of concrete risks.');
  if (evidence.needsDomainKnowledge) add('domain', 'Exploration identified a domain knowledge or tool capability gap.');
  if (evidence.unknowns.length && !gaps.length) return { ...base, action: 'clarify', reasons: ['Important unknowns remain but their nature is unspecified. Resolve whether they need user input, further investigation, or a particular method.'], gaps: [], candidates: [] };
  if (!gaps.length && (evidence.requirementsClear !== true || evidence.verificationReady !== true)) return { ...base, action: 'explore', reasons: ['Confirm the expected result and a suitable verification method before choosing direct execution.'], gaps: [], candidates: [] };
  if (!gaps.length) return { ...base, action: 'direct', reasons: ['Task-bound findings establish a bounded change, clear requirements, and suitable verification. No added workflow is justified.'], gaps: [], candidates: [] };
  const candidates = shortlist(`${task}\n${evidence.findings.join('\n')}\n${evidence.unknowns.join('\n')}`, catalog, gaps, limit, []);
  if (!candidates.length) reasons.push('No eligible matching skill was discovered. Apply a suitable method directly or investigate the missing capability; do not install a framework automatically.');
  return { ...base, action: 'consider-skills', reasons, gaps, candidates };
}
