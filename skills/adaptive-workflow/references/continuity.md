<!-- adaptive-workflow:reference continuity -->
# Preserve useful work without preserving stale claims

Read when changed requirements, a handoff or resumed work makes earlier evidence uncertain. Use current context and existing project artifacts first. Save a compact record only when continuity actually requires it; a small edit needs no new file.

## Keep the decision and its support together

A useful checkpoint connects the current acceptance contract, the active decision and the evidence supporting it. Record enough to resume the next action:

- Requested behavior and any still-missing business decision.
- Relevant files or dependencies, the observation or executed command, its actual result and the behavior it covers.
- Current hypothesis, what would disprove it, and the next distinguishing check.
- Completed changes and tests worth retaining, with remaining work or a real blocker.

Use the smallest existing artifact that serves this purpose. Reference logs or source locations rather than copying full inventories and transcripts. Keep private records out of distributed source. Distinguish an observed failure from assertions that were never reached.

## Invalidate by dependency, not by task label

| What changed | What needs reconsideration | What can remain useful |
| --- | --- | --- |
| An implementation or test dependency | Claims supported by the changed boundary or assertions | Unaffected contracts, observations and checks |
| A requirement | The affected acceptance criteria and corresponding decisions | Behavior and verification still required by the original contract |
| A tool, environment or external input | Results dependent on that version, state or input | Independent evidence with unchanged support |
| A prior hypothesis | Conclusions inferred from it | The raw observations that led to or contradicted it |

A new requirement is a new contract, not proof that accepted earlier work was defective. Reuse unaffected checks. A changed test cannot retroactively prove an earlier execution covered its new assertions.

## Resume with a bounded validity check

Confirm the active contract and which supporting dependencies changed. Recheck affected evidence and continue the next unresolved action; do not replay the whole investigation. If the dependency set is incomplete or an external state is unknown, state that limit and verify what matters now.

When change is relevant, explain the affected decision, the valid work retained and the next decisive check in the user's language. Reduce the process when uncertainty resolves.

## Optional file evidence helper

When a saved observation depends on a known set of project files, [check-evidence.mjs](../scripts/check-evidence.mjs) can capture their fingerprints and later report `unchanged`, `changed` or `missing`:

```text
node <skill-directory>/scripts/check-evidence.mjs capture --root <project> --output <project>/local-evidence.json <relative-file> ...
node <skill-directory>/scripts/check-evidence.mjs check --root <project> --record <project>/local-evidence.json
```

The optional helper uses Node.js built-ins and requires no package installation. If Node.js is unavailable, use the host's existing file/version tools or inspect the affected dependencies directly; do not install a runtime solely for this method.

Choose the files that actually support the observation, including relevant tests and local dependency/configuration files when necessary. Do not capture unrelated personal configuration. `unchanged` establishes only matching selected file contents, not a passing test, complete dependency coverage, unchanged environment or authorization. Add the actual command/result and contract in context or the existing record separately. Changes require reassessment, not automatic execution or deletion.

The check command exits with 0 when selected files are unchanged, 1 when a file changed or is missing, and 2 for invalid input or a boundary error. Capture refuses to overwrite an existing record. Records contain the local project path; retain them locally. This is a selected-content snapshot, not a signed record or an atomic snapshot of files changing concurrently.
