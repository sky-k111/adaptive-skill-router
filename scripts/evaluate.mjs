import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { scanSkills, routeTask } from '../dist/index.js';

const cwd = resolve('.');
const catalog = await scanSkills({ cwd, home: resolve('fixtures/empty-home'), env: {}, roots: [{ path: resolve('fixtures/skills'), host: 'codex', scope: 'custom' }] });
const base = { explored: true, findings: ['Observed behavior and inspected relevant existing checks.'], unknowns: [], scope: 'local', risk: 'low', requirementsClear: true, verificationReady: true };
const cases = [
  { name: 'unexplored request', task: 'Fix a bug', expected: 'explore' },
  { name: 'small proven bug', task: 'Fix a bug', evidence: { rootCauseKnown: true }, expected: 'direct' },
  { name: 'large mechanical edit', task: 'Rename text in 100 files', evidence: {}, expected: 'direct' },
  { name: 'unknown root cause', task: 'Fix cache', evidence: { rootCauseKnown: false }, expected: 'consider-skills', gaps: ['debug'] },
  { name: 'regression coverage gap', task: 'Fix state isolation', evidence: { verificationReady: false }, expected: 'consider-skills', gaps: ['test'] },
  { name: 'dependent interfaces', task: 'Update parsing and validation interfaces', evidence: { scope: 'cross-module', coordinationNeeded: true }, expected: 'consider-skills', gaps: ['plan'] },
  { name: 'risk on one line', task: 'Change a permission comparison', evidence: { risk: 'high' }, expected: 'consider-skills', gaps: ['review'] },
  { name: 'important unknown', task: 'Change a product rule', evidence: { unknowns: ['Owner has not chosen the business rule.'] }, expected: 'clarify' },
  { name: 'scope still unknown', task: 'Fix cache', evidence: { scope: 'unknown' }, expected: 'explore' },
  { name: 'resolved investigation', task: 'Fix cache', evidence: { rootCauseKnown: true, stalled: false }, expected: 'direct' }
];
for (const item of cases) {
  const decision = routeTask(item.task, catalog, { evidence: item.evidence ? { ...base, ...item.evidence, task: item.task } : undefined });
  assert.equal(decision.action, item.expected, item.name);
  if (item.gaps) assert.deepEqual(decision.gaps, item.gaps, item.name);
  assert.deepEqual(decision.selectedSkills, [], 'Retrieval must not masquerade as semantic selection.');
  for (const candidate of decision.candidates.filter(s => s.name === 'always-heavy')) {
    assert.ok(candidate.advisories.includes('broad-trigger-policy'), 'Broad triggers must be visible for host judgment, never treated as final selection.');
  }
  console.log(`PASS ${item.name}: ${decision.action}`);
}
console.log(`${cases.length}/${cases.length} routing scenarios passed. These are policy regressions, not agent-quality or token-savings benchmarks.`);
