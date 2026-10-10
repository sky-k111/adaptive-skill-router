---
name: adaptive-skill-router
description: Choose and explain a proportionate development method when relevant code exploration leaves a knowledge, debugging, planning, testing, or review gap. Make meaningful decisions, adjustments and verification visible in conversation. Clear bounded edits usually proceed directly.
---

# Adaptive Skill Router

Explore related code, errors and existing checks first. When the cause, scope and verification are clear, execute directly. Task size, a bug label or available Skills alone do not justify plans, documents, TDD or subagents.

## Choose a useful method

- Unproven cause or stalled investigation: consider systematic debugging.
- Insufficient behavior coverage: consider targeted test design.
- Unresolved requirements or actual interface coordination: consider planning. Cross-module scope alone is insufficient.
- Serious consequences: consider review of concrete risks.
- Missing specialist knowledge: consider the relevant domain Skill.

Choose only when you can identify the gap and explain why the method's expected value warrants its added work. Using your own reasoning or choosing no Skill is valid. Resolve whether unknowns need investigation or a user's business decision; do not automatically interrupt the user.

## Reuse capabilities before discovering more

Use the current session's reliable Skill catalog when sufficient. No scan or route is required merely to demonstrate this workflow. Read only a plausible candidate and its relevant resources.

If discovery or method choice still needs the CLI, read [CLI and evidence reference](references/routing.md). It covers trusted commands, discovery boundaries and evidence field types. Keep full inventories in a local file if needed; show only relevant candidates and diagnostics.

Disk discovery does not establish current session availability. Native discovery represents a fresh CLI process. Custom roots do not register Skills. Respect disabled, explicit-only and unverified-cache restrictions.

Before adopting a candidate, check its required tools, scripts and project setup; an installed CLI alone does not make a framework project-ready. Consider required downstream Skills, documents and coordination. User goals and project constraints govern broad third-party triggers and fixed phases. Preserve required checks; describe partial adoption honestly. Do not rewrite third-party Skills or invocation policies to resolve a conflict. Candidates and retrieval scores do not authorize execution.

## Make the work understandable in conversation

Use brief, natural progress messages in the user's language at meaningful decisions and milestones:

- After relevant exploration, connect a concrete observation or remaining gap to the chosen method, next action and behavior to verify. Bound claims to the code actually inspected. When this workflow is explicitly requested, identify it once with that substantive decision.
- When selecting another Skill, name it and the gap it should address. Distinguish considering, preparing to read, and actually adopting it; describe the portion used honestly. If prerequisites are missing, explain the limitation and useful fallback within existing authorization.
- When new evidence or requirements invalidate a decision, state what changed, which work remains valid and the next decisive check. When uncertainty resolves, explain the resulting smaller scope or sufficient verification rather than continuing extra phases.
- At a meaningful result, explain what has been established and what still matters. At delivery, connect the actual change and checks to acceptance; distinguish passed, failed, incomplete and unrun verification. Do not infer that later assertions ran after an earlier failure.

Show these facts as work happens, not only in a retrospective report. Clear small edits need only a short action/result update; do not load this Skill just to produce one. These are useful occasions, not required stages or a fixed message count. Combine updates when appropriate. Avoid repeated workflow banners, tool-by-tool narration, scoring, inventories and optional reports merely to display activity. Never invent a gap, Skill invocation, whole-project audit or benefit claim to make the workflow noticeable. Explanations do not create approval gates; continue authorized work.

## Adapt and finish

Reassess when relevant code, requirements or observations change a decision, rather than after every tool call. Reuse still-valid findings and completed work, update affected acceptance criteria, distinguish hypotheses from proven causes, and reduce extra process once uncertainty resolves.

Verify the requested behavior proportionately, obey project checks and report unrun verification. Continue within existing authorization; retain necessary approval boundaries for destructive or production operations and sensitive data/permissions. Stop when acceptance is satisfied. If the CLI is unavailable, report the limitation and apply these principles directly; do not silently install dependencies. Judge outcomes and total cost rather than completed workflow stages.
