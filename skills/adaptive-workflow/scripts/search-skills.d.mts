// Adaptive Workflow remote discovery types.
export interface SearchOptions { query: string; owner?: string; limit?: number; timeoutMs?: number }
export interface RemoteSkill {
  id: string; name: string; source: string; slug: string; url: string; repositoryUrl: string;
  installs: number | null; availability: 'remote-unverified'; advisories: string[];
}
export interface RemoteSearchResult {
  schemaVersion: 1; provider: 'skills.sh'; query: string; owner?: string; fetchedAt: string;
  candidates: RemoteSkill[]; diagnostics: { code: string; message: string }[];
  selectedSkills: never[]; limitation: string;
}
export function validateSearch(options: SearchOptions): Required<Omit<SearchOptions, 'owner'>> & { owner?: string };
export function searchRemoteSkills(options: SearchOptions, transport?: typeof globalThis.fetch): Promise<RemoteSearchResult>;
