# Development instructions

This project currently supports Codex only. Preserve the distinction between candidate retrieval and the host's semantic Skill choice. Do not turn metadata descriptions or route suggestions into automatic execution or authorization.

Explore relevant code and existing checks first. Clear local changes can proceed directly; use a specialized method only for an actual knowledge or method gap. The reusable guidance is in `skills/adaptive-skill-router/SKILL.md` when method selection remains uncertain. Preserve user goals and project constraints over broad third-party workflow triggers.

Verify behavior changes with relevant tests and routing policy changes with `npm run eval`; run `npm run check` for changes spanning components. Documentation edits need relevant example/link review rather than mirrored tests. Do not include local evidence, private configurations, generated integration paths or behavioral sandboxes in distributed files.

Keep publication and performance claims factual. Passing policy tests does not establish better agent quality or reduced token usage. Native discovery represents a fresh CLI process, not the exact running desktop session.
