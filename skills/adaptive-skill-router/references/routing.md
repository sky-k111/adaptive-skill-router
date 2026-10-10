# Adaptive Skill Router routing evidence

Read this only when CLI discovery or routing is useful. A reliable session catalog and clear method choice need neither a scan nor an evidence file.

## Commands and scope

Use the project bindings in the generated entry. Otherwise use a known installed `asr` or `node <trusted-absolute-dist/cli.js>`; do not assume an unrelated command named `asr` is this tool.

```text
asr scan --cwd <project-root> --json
asr route --task-file <task.txt> --evidence <evidence.json> --cwd <project-root> --json
asr inspect <exact-id> --cwd <project-root> --json
```

Pass arguments through the host tool with its shell quoting rules; do not interpolate arbitrary task text into a shell command. Use the intended project root for `--cwd`, even when editing a child directory. Without a Git root, disk project discovery covers only that directory and reports the boundary. An empty child inventory does not establish that the parent has no Skills. Add an explicit `--root` only when needed; it inventories a directory without registering it with Codex.

`--native` queries a fresh trusted Codex CLI, not the existing desktop session. Do not combine it with disk-root options. `inspect` reads a discovered manifest; the host still determines eligibility and semantic value.

## Task-bound evidence

Required keys:

- `task`: exact task text string; task-file trailing whitespace is removed.
- `explored`: boolean.
- `findings`, `unknowns`: arrays of non-empty strings; explored evidence requires a finding.
- `scope`: `local`, `cross-module`, or `unknown`.
- `risk`: `low`, `medium`, `high`, or `unknown`.

Optional booleans: `rootCauseKnown`, `requirementsClear`, `verificationReady`, `regressionRisk`, `stalled`, `production`, `destructive`, `needsDomainKnowledge`, `coordinationNeeded`. Set coordination only for an observed unresolved coordination need. Existing green tests alone do not establish coverage of a reported failure.

Findings should identify relevant code or actual check results. Separate observed facts from hypotheses. Refresh affected evidence after relevant code or outcomes change, even if task text remains identical. The CLI validates format and task binding, not truth or freshness. Scores retrieve metadata matches; negation, relevance and total invocation cost remain host judgments. `clarify` is a prompt to classify the unknown, not an automatic request for user input.
