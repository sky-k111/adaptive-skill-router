# Installation-to-completion walkthrough

[中文](usage-walkthrough-2026-10-15.zh-CN.md) · [Cross-project setup](setup.md)

This record follows public installation, a global working agreement, a first response, an actual source repair and independent acceptance. There is no default-Codex comparison or quality/token-saving claim.

## Source and environment

The built-in installer downloaded the standalone skill from public commit [e29e8a4](https://github.com/sky-k111/adaptive-skill-router/tree/e29e8a4d71230c7a6b32eb347af199d1283397e0); all ten resources matched that version. The host was Windows, Codex CLI 0.162.0 and Node.js 24.18.0, using the user's existing gpt-6.1-sol / high settings.

A fresh profile and project copy did not inherit the author's personal instructions or earlier conversations. The published [agreement](../examples/global-guidance.md) was merged with a short existing working agreement. Three already-installed specialist skills were copied for this task: debugging, test-driven work and completion verification. Codex also supplied built-ins. This is the walkthrough's library, not a bundled or required dependency set.

Commands used the workspace-write sandbox. Temporary authentication was separately protected and removed afterward. Raw sessions, profiles and task workspaces are not distributed.

## Task and first response

The original source had a real adapter defect: after a runtime-listed parent manifest disappeared, recursively scanning its directory could return an unlisted nested skill. No defect was injected and no production incident is claimed. Reproduction used controlled runtime responses.

The first prompt did not name the manager or prescribe skills. It requested an approach while preserving interfaces, invocation restrictions and inspection behavior; project reads and implementation were prohibited, but skill-instruction reads were allowed.

An English summary of the actual Chinese reply is: only skill instructions have been read; Adaptive Workflow coordinated the approach and systematic debugging supplied investigation guidance; test-driven work and completion verification would be read and adopted during implementation. The [Chinese record](usage-walkthrough-2026-10-15.zh-CN.md) contains the original excerpt.

Tool records confirm successful reads of the manager and debugging instructions. No project code, tests or modifications were performed in this first stage.

## Work and actual skill use

The same conversation was then authorized to repair the project copy without networking, installing dependencies, delegating, publishing or modifying global settings.

It traced the runtime-list-to-directory-scan path, identified recursive fallback and missing membership filtering, read the test-driven instructions and reproduced expected regression failures. Five new checks passed after the repair. The only source changes were [native discovery](../src/native.ts) and [its tests](../test/native.test.mjs): stop recursive traversal and exclude paths absent from the runtime records.

Tests preserve bounded scanning, explicitly listed nested skills, disabled/explicit-only restrictions and inspection invalidation after instruction or invocation-metadata changes. The completion-verification skill was read before delivery; no extra framework, planning package or feature was introduced.

## Failures and independent acceptance

Three initial attempts failed to complete because the acceptance tooling placed files under inaccessible private-directory ancestors. The first continuation also used an unsupported CLI argument. These failures remain recorded. The agent reported unavailable reads rather than claiming skill adoption or a repair.

The successful two-stage conversation used a normally accessible copy. Only the test skill resources received the necessary additional access; the entire profile was not opened and the sandbox remained enabled.

The worker still encountered Node subprocess `spawn EPERM`. It used the existing runner without process isolation for new regressions, passed 37 related checks and all ten policy cases, and reported its full check as unsuccessful. Another run placed test fixtures inside a Git tree, violating the existing non-Git-boundary test's prerequisite; that failure is retained.

Independent acceptance then ran the unchanged full suite where subprocess execution was permitted and test fixtures were outside the repository: **157 passed, two file-symlink permission skips, 10/10 policy cases**. No failing tests were removed. A previously prepared protocol check, withheld from the worker, observed the unlisted nested entry before the fix and none afterward; normal entries and invocation restrictions also passed, for three groups in total. This uses a local protocol subprocess, not a claim of live Codex-runtime compatibility.

The reviewed repair is integrated here. Private profiles, raw evidence, personal paths, credentials and third-party skill instructions are excluded from distribution.

## Supported conclusion

The published setup worked in this fresh CLI environment and supported one completed source-maintenance task. Observable behavior includes task-specific selection, staged adoption and honest verification limits.

This does not establish reliable activation from descriptions alone, all-library compatibility, identical desktop behavior or general causal benefits. Present it as an early preview with a concrete usage record.
