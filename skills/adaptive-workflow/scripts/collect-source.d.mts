// Adaptive Workflow source collection types.
export interface SourceOptions { source: string; path?: string; skill?: string; ref?: string; include?: string[]; timeoutMs?: number }
export interface SourceFile { path: string; role: string; gitBlobSha: string; sha256: string; url: string; content: string }
export interface SourceCollection {
  schemaVersion: 1; source: string; requestedRef: string; commit: string; manifest: string;
  status: 'complete' | 'incomplete'; reviewStatus: 'not-reviewed'; files: SourceFile[];
  unresolved: { path: string; reason: string }[]; connectionRetried: boolean; selectedSkills: never[]; coverage: string;
}
export function validateSource(options: SourceOptions): SourceOptions & { ref: string; include: string[]; timeoutMs: number };
export function collectSkillSource(options: SourceOptions, transport?: typeof fetch): Promise<SourceCollection>;
