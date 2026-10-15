import type { Catalog, Skill } from './types.js';
import { relevanceSignals, validateConstraints, type Constraints } from '../skills/adaptive-workflow/scripts/search-skills.mjs';
export { searchRemoteSkills, validateSearch } from '../skills/adaptive-workflow/scripts/search-skills.mjs';
export type { RemoteSkill, RemoteSearchResult, SearchOptions } from '../skills/adaptive-workflow/scripts/search-skills.mjs';

export function discoverLocalSkills(query: string, catalog: Catalog, limit = 5, constraints: Constraints = {}) {
  if (!query.trim()) throw new Error('A non-empty discovery query is required.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Candidate limit must be an integer between 1 and 20.');
  validateConstraints(constraints);
  const priority = { candidate: 0, 'explicit-only': 1, 'unverified-plugin': 2, disabled: 3 };
  return catalog.skills.flatMap((skill: Skill) => {
    const relevance = relevanceSignals(query, skill.name, skill.description, constraints);
    if (!relevance.matchedTerms.length || !relevance.matchesConstraints) return [];
    const eligibility: keyof typeof priority = skill.disabled ? 'disabled' : skill.availability === 'unverified-plugin' ? 'unverified-plugin' : !skill.automatic ? 'explicit-only' : 'candidate';
    return [{ id: skill.id, name: skill.name, path: skill.path, inspectionFingerprint: skill.inspectionFingerprint, description: skill.description, eligibility,
      retrievalScore: relevance.retrievalScore, matchedTerms: relevance.matchedTerms, relevance, advisories: skill.advisories,
      estimatedBodyTokens: skill.estimatedBodyTokens }];
  }).sort((a, b) => priority[a.eligibility] - priority[b.eligibility] || b.retrievalScore - a.retrievalScore || a.estimatedBodyTokens - b.estimatedBodyTokens || a.id.localeCompare(b.id)).slice(0, limit);
}
