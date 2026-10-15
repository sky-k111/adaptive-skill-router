export type Host = 'codex';
export type Method = 'debug' | 'test' | 'plan' | 'review' | 'domain';
export interface Root {
  path: string;
  host: Host;
  scope: 'user' | 'project' | 'admin' | 'custom' | 'plugin-cache';
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  path: string;
  realPath: string;
  host: Host;
  scope: Root['scope'];
  origins: string[];
  fingerprint: string;
  inspectionFingerprint: string;
  automatic: boolean;
  userInvocable: boolean;
  disabled: boolean;
  availability: 'discovered' | 'unverified-plugin';
  methods: Method[];
  estimatedBodyTokens: number;
  advisories: string[];
}
export interface Diagnostic { code: string; path: string; message: string }
export interface Catalog {
  schemaVersion: 1;
  cwd: string;
  roots: Root[];
  skills: Skill[];
  diagnostics: Diagnostic[];
}
export interface ScanOptions {
  cwd?: string;
  home?: string;
  env?: NodeJS.ProcessEnv;
  host?: Host;
  roots?: Root[];
  extraRoots?: string[];
  includePluginCache?: boolean;
  maxDepth?: number;
  maxFiles?: number;
}
export interface Evidence {
  task: string;
  explored: boolean;
  findings: string[];
  unknowns: string[];
  scope: 'local' | 'cross-module' | 'unknown';
  risk: 'low' | 'medium' | 'high' | 'unknown';
  rootCauseKnown?: boolean;
  requirementsClear?: boolean;
  verificationReady?: boolean;
  regressionRisk?: boolean;
  stalled?: boolean;
  destructive?: boolean;
  production?: boolean;
  needsDomainKnowledge?: boolean;
  coordinationNeeded?: boolean;
}
export interface Candidate {
  id: string;
  name: string;
  path: string;
  inspectionFingerprint: string;
  description: string;
  methods: Method[];
  reasons: string[];
  estimatedBodyTokens: number;
  advisories: string[];
  retrievalScore: number;
}
export interface Decision {
  schemaVersion: 1;
  action: 'explore' | 'direct' | 'consider-skills' | 'clarify';
  host: Host;
  reasons: string[];
  gaps: Method[];
  candidates: Candidate[];
  selectedSkills: never[];
  approvalCheckRequired: boolean;
  verification: string;
  limitation: string;
}
