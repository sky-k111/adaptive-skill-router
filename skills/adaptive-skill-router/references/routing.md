# Adaptive Skill Router routing evidence

Read this only when CLI discovery or routing is useful. A reliable session catalog and clear method choice need neither a scan nor an evidence file.

## Commands and scope

Use the project bindings in the generated entry. Otherwise use a known installed `asr` or `node <trusted-absolute-dist/cli.js>`; do not assume an unrelated command named `asr` is this tool.

```text
asr scan --cwd <project-root> --json
asr discover "capability keywords" --cwd <project-root> --json
asr discover "capability keywords" --online --owner <github-owner> --cwd <project-root> --json
asr source <owner/repository> --path <exact/SKILL.md> --ref <commit> --cwd <project-root> --json
asr route --task-file <task.txt> --evidence <evidence.json> --cwd <project-root> --json
asr inspect <exact-id> --expect <inspectionFingerprint> --cwd <project-root> --json
```

Pass arguments through the host tool with its shell quoting rules; do not interpolate arbitrary task text into a shell command. Use the intended project root for `--cwd`, even when editing a child directory. Without a Git root, disk project discovery covers only that directory and reports the boundary. An empty child inventory does not establish that the parent has no Skills. Add an explicit `--root` only when needed; it inventories a directory without registering it with Codex.

`--native` queries a fresh trusted Codex CLI, not the existing desktop session. Do not combine it with disk-root options. `inspect` reads a discovered manifest; the host still determines eligibility and semantic value.

When inspecting an earlier local candidate, pass its `inspectionFingerprint` from scan/discover/route with the same roots and mode. Changed entry instructions, invocation metadata or resolved paths cause failure; rediscover before reviewing the new version. Omitting `--expect` reads the latest scan. The token covers `SKILL.md` and optional `agents/openai.yaml`, not supporting scripts/documents or current host permissions.

`discover` searches local names and descriptions without task evidence or method classification; it does not select skills. Local matches retain invocation restrictions and exact identities. `--online` also sends only the explicit capability keywords, optional owner and result limit to skills.sh. Do not send project contents or sensitive task descriptions. Online candidates remain separate and unverified; follow [capability selection](capability-selection.md) to review exact source instructions and prerequisites. Without `--online`, no registry request is made. Remote failure retains local results, sets `remote.status` to `failed` and exits 2; it is not a successful empty search. Offline and successful online discovery exit 0; invalid input and local discovery errors exit 1.

Discovery accepts repeatable `--require` / `--exclude` metadata terms and reports lexical coverage. These do not establish semantic fit. `source` explicitly collects bounded source files at one commit; incomplete collection exits 2 with per-file reasons. Its `reviewStatus` remains `not-reviewed`: the host still assesses prerequisites, license applicability and the actual contribution. It never installs or executes collected scripts.

## Task-bound evidence

Required keys:

- `task`: exact task text string; task-file trailing whitespace is removed.
- `explored`: boolean.
- `findings`, `unknowns`: arrays of non-empty strings; explored evidence requires a finding.
- `scope`: `local`, `cross-module`, or `unknown`.
- `risk`: `low`, `medium`, `high`, or `unknown`.

Optional booleans: `rootCauseKnown`, `requirementsClear`, `verificationReady`, `regressionRisk`, `stalled`, `production`, `destructive`, `needsDomainKnowledge`, `coordinationNeeded`. Set coordination only for an observed unresolved coordination need. Existing green tests alone do not establish coverage of a reported failure.

Findings should identify relevant code or actual check results. Separate observed facts from hypotheses. Refresh affected evidence after relevant code or outcomes change, even if task text remains identical. The CLI validates format and task binding, not truth or freshness. Scores retrieve metadata matches; negation, relevance and total invocation cost remain host judgments. `clarify` is a prompt to classify the unknown, not an automatic request for user input.
