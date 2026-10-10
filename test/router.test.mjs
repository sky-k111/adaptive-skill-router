import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTask, scanSkills } from '../dist/index.js';
import { sandbox, skill, put, options, evidence } from './helpers.mjs';

async function catalog(t) {
  const root = await sandbox(t);
  await skill(root, 'debug', 'focused-debug', 'Diagnose unknown root causes in code. 调试根因');
  await skill(root, 'test', 'focused-test', 'Design regression tests and boundary cases. 测试');
  await skill(root, 'plan', 'focused-plan', 'Plan cross-module dependencies and requirements. 规划');
  await skill(root, 'review', 'focused-review', 'Review data integrity and permissions. 审查');
  await skill(root, 'broad', 'always-process', 'Use when starting any conversation.');
  return scanSkills(options(root));
}

test('starts with exploration even when the task sounds complex', async t => {
  const result = routeTask('Large complicated architecture redesign', await catalog(t));
  assert.equal(result.action, 'explore');
  assert.deepEqual(result.candidates, []);
});
test('a proven local bug stays direct despite available debugging skills', async t => {
  const task = 'Fix the obvious pagination bug';
  const result = routeTask(task, await catalog(t), { evidence: evidence(task, { rootCauseKnown: true }) });
  assert.equal(result.action, 'direct');
  assert.deepEqual(result.candidates, []);
});
test('unknown root cause escalates methods without requiring a full pipeline', async t => {
  const task = 'Fix intermittent cache failure';
  const result = routeTask(task, await catalog(t), { evidence: evidence(task, { rootCauseKnown: false, unknowns: ['Cache owner remains unknown.'] }) });
  assert.deepEqual(result.gaps, ['debug']);
  assert.ok(result.candidates.some(c => c.name === 'focused-debug'));
  assert.ok(!result.candidates.some(c => c.name === 'focused-plan'));
  assert.deepEqual(result.selectedSkills, []);
});
test('Chinese task retrieval supports method gaps', async t => {
  const task = '定位缓存中的偶发错误';
  const result = routeTask(task, await catalog(t), { evidence: evidence(task, { rootCauseKnown: false }) });
  assert.equal(result.candidates[0].name, 'focused-debug');
});
test('one-line high-risk change triggers review and checks authorization for production', async t => {
  const task = 'Change one permission comparison';
  const result = routeTask(task, await catalog(t), { evidence: evidence(task, { risk: 'high', production: true }) });
  assert.ok(result.gaps.includes('review'));
  assert.equal(result.approvalCheckRequired, true);
});
test('resolved uncertainty allows returning to direct execution', async t => {
  const task = 'Fix cache';
  const inventory = await catalog(t);
  assert.equal(routeTask(task, inventory, { evidence: evidence(task, { rootCauseKnown: false }) }).action, 'consider-skills');
  assert.equal(routeTask(task, inventory, { evidence: evidence(task, { rootCauseKnown: true }) }).action, 'direct');
});
test('cross-module scope alone does not establish a planning gap', async t => {
  const task = 'Rename the same label across components';
  const inventory = await catalog(t);
  const direct = routeTask(task, inventory, { evidence: evidence(task, { scope: 'cross-module' }) });
  assert.equal(direct.action, 'direct');
  const coordinated = routeTask(task, inventory, { evidence: evidence(task, { scope: 'cross-module', coordinationNeeded: true }) });
  assert.deepEqual(coordinated.gaps, ['plan']);
});
test('common English words do not inflate metadata overlap', async t => {
  const root = await sandbox(t);
  await skill(root, 'generic', 'generic-debug', 'Debug and review for the code');
  await skill(root, 'cache', 'cache-debug', 'Debug cache isolation');
  const inventory = await scanSkills(options(root));
  const task = 'Fix cache isolation for the application';
  const decision = routeTask(task, inventory, { evidence: evidence(task, { rootCauseKnown: false }) });
  assert.equal(decision.candidates[0].name, 'cache-debug');
  assert.equal(decision.candidates.find(c => c.name === 'generic-debug').retrievalScore, 3);
});
test('does not treat a skill availability or the word bug as sufficient value', async t => {
  const task = 'Fix typo in the bug report';
  assert.equal(routeTask(task, await catalog(t), { evidence: evidence(task) }).action, 'direct');
});
test('rejects stale evidence and fabricated certainty fields', async t => {
  const inventory = await catalog(t);
  assert.throws(() => routeTask('new task', inventory, { evidence: evidence('old task') }), /exactly match/);
  assert.throws(() => routeTask('task', inventory, { evidence: evidence('task', { findings: [] }) }), /finding/);
  assert.throws(() => routeTask('task', inventory, { evidence: evidence('task', { rootCauseKnown: 'true' }) }), /boolean/);
  assert.throws(() => routeTask('task', inventory, { evidence: evidence('task', { scope: ['local'] }) }), /scope/);
  assert.throws(() => routeTask('task', inventory, { evidence: evidence('task', { risk: ['low'] }) }), /risk/);
});
test('explicit-only skills are excluded automatically but honored by explicit id', async t => {
  const root = await sandbox(t);
  await skill(root, 'manual', 'manual-debug', 'Diagnose root cause');
  await put(root, 'manual/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false');
  const inventory = await scanSkills(options(root));
  const task = 'Fix bug';
  assert.deepEqual(routeTask(task, inventory, { evidence: evidence(task, { rootCauseKnown: false }) }).candidates, []);
  assert.equal(routeTask(task, inventory, { requestedSkills: [inventory.skills[0].id] }).candidates.length, 1);
});
test('disabled and cached skills cannot be selected even by explicit request', async t => {
  const inventory = await catalog(t);
  inventory.skills[0].disabled = true;
  assert.throws(() => routeTask('task', inventory, { requestedSkills: [inventory.skills[0].id] }), /disabled/);
  inventory.skills[0].disabled = false;
  inventory.skills[0].availability = 'unverified-plugin';
  assert.throws(() => routeTask('task', inventory, { requestedSkills: [inventory.skills[0].id] }), /unverified/);
});
test('ambiguous names require precise identities', async t => {
  const root = await sandbox(t);
  await skill(root, 'one', 'debug', 'Debug code');
  await skill(root, 'two', 'debug', 'Debug another system');
  const inventory = await scanSkills(options(root));
  assert.throws(() => routeTask('task', inventory, { requestedSkills: ['debug'] }), /ambiguous/);
});
test('unclassified unknowns are surfaced instead of claiming a direct path', async t => {
  const task = 'Change behavior';
  assert.equal(routeTask(task, await catalog(t), { evidence: evidence(task, { unknowns: ['Business owner has not chosen desired behavior.'] }) }).action, 'clarify');
});
