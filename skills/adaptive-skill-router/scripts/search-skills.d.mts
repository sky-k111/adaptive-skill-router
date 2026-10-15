// Adaptive Workflow remote discovery types.
export interface Constraints { requiredTerms?: string[]; excludedTerms?: string[] }
export interface Relevance {
  matchedTerms: string[]; queryCoverage: number; missingRequiredTerms: string[]; matchedExcludedTerms: string[];
  retrievalScore: number; matchesConstraints: boolean;
}
export interface SearchOptions extends Constraints { query: string; owner?: string; limit?: number; timeoutMs?: number }
export interface RemoteSkill {
  id: string; name: string; source: string; slug: string; url: string; repositoryUrl: string;
  installs: number | null; availability: 'remote-unverified'; advisories: string[];
  providerRank: number; relevance: Relevance;
}
export interface RemoteSearchResult {
  schemaVersion: 1; provider: 'skills.sh'; query: string; owner?: string; fetchedAt: string;
  candidates: RemoteSkill[]; filteredCandidates: RemoteSkill[]; diagnostics: { code: string; message: string }[];
  selectedSkills: never[]; limitation: string;
}
export function metadataTokens(text: string): Set<string>;
export function validateConstraints(options?: Constraints): Required<Constraints>;
export function relevanceSignals(query: string, name: string, description?: string, constraints?: Constraints): Relevance;
export function validateSearch(options: SearchOptions): Required<Omit<SearchOptions, 'owner'>> & { owner?: string };
export function searchRemoteSkills(options: SearchOptions, transport?: typeof globalThis.fetch): Promise<RemoteSearchResult>;
export function configureCliProxy(proxy?: string): () => void;
