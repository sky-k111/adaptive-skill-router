# Evaluate outcomes, not ceremony

`npm run check` runs implementation tests and ten deterministic evidence-policy scenarios. Passing them establishes expected behavior for those inputs, not improved agent intelligence or lower token cost.

## Current checks

Implementation tests cover malformed metadata, aliases and Unicode, duplicate names, symlink/junction loops, invocation restrictions, disabled configuration, cache uncertainty, source changes, exploration-first routing, evidence binding, explicit choices, safe previews, backups and idempotent integration. Some systems cannot create file symlinks; that check explicitly reports a skip while directory-link checks can still run.

The ten policy scenarios include a clear bug, a large mechanical edit, an unknown root cause, missing regression coverage, interfaces spanning modules, a high-consequence one-line change, a business unknown, unknown scope, and de-escalation after resolution. Fixtures offer narrow debugging/testing/planning methods and a deliberately overbroad workflow. A broad trigger alone never creates a method gap or final selection; matched broad candidates retain an advisory for the host.

## Independent behavior smoke test

Build, then run `node scripts/create-behavior-workspace.mjs /fresh/path`. Existing directories are rejected. The sandbox has project integration, fixture Skills and three cases:

1. Correct a greeting without changing its public signature.
2. Repair tenant-isolation behavior while retaining cached repeated reads.
3. Add optional text/JSON output across input and formatting interfaces, preserving default behavior and rejecting invalid input.

A separate Codex conversation reads the sandbox instructions and tasks, completes fixes, then reports findings, actual Skill reads, actual CLI use, tests and unsupported assumptions. Do not tell it which Skill each case is expected to use. A root cause proven immediately may justify a direct fix even in the cache case. A multi-file edit does not alone establish that a full planning framework is beneficial.

Use `node scripts/verify-behavior-workspace.mjs <completed-workspace>` for a separate acceptance-contract check of greetings, tenant identity/caching, and output options. The tests supplied or added by the test agent are useful evidence, but do not replace this evaluator-owned check.

## Recorded first smoke run: 2026-10-10

A separate Codex session completed the three cases with 1, 4 and 9 passing tests. It used no Skill or routing CLI for the first two cases because the causes and useful verification were immediately clear. For the output feature it read adaptive guidance, actually scanned and routed, chose targeted behavior tests, and declined a full design/plan workflow. Fixture candidates were on disk but not in that session's loaded catalog, so it did not claim to invoke them.

That run exposed one genuine interface failure: the generated Skill omitted evidence field types, so the first route call supplied an array for `explored` and was rejected. The source now states boolean/array types. Its feedback also led to excluding common English overlap words and requiring observed coordination needs rather than cross-module scope alone for planning advice. Negation and semantic relevance remain host responsibilities. This report records observations and fixes, not a benchmark against baseline Codex or a measured savings claim.

This is a smoke test: the same model family, instructions, small synthetic tasks and user-supplied preferences limit generalization. The test chat can read the routing tool, so it is not a blinded study. Expected contracts must also be checked independently by the evaluator; agent self-reports alone are insufficient.

## Before claiming an improvement

For framework-loaded experiments, `node scripts/create-framework-experiment.mjs <fresh-workspace>` creates the original three tasks plus an asynchronous queue-isolation task. Its existing test passes before the fix; the independent verifier checks tenant context during a held load, FIFO processing, deferred reads, later-batch isolation and per-request rejection without timed sleeps. Run `node scripts/verify-framework-experiment.mjs <completed-workspace>` for acceptance. The generator refuses existing directories.

An explicit-entry usability comparison can use fresh copies of the output task with different project Skill versions and the same task prompt, then run `node scripts/verify-behavior-workspace.mjs <workspace> --output-only`. Keep the old entry frozen, preserve global instructions across both runs, and record actual Skill reads and CLI calls. Explicitly loading an entry is a positive control; it does not test implicit activation. A reused conversation carries prior task context, so these runs are exploratory usability checks rather than blinded or independent quality/performance benchmarks. Preserve the exact verifier used if development continues concurrently.

## Investigation and changing evidence

After building, `node scripts/create-investigation-workspace.mjs <fresh-workspace>` creates a resource-cache incident with a passing sequential smoke test, overlapping refreshes, recoverable failures and arbitrary string identities. The task specifies the full acceptance contract. The incident includes an unproven operator explanation; it is not an instruction to change a gateway or force a particular method. Existing targets are rejected.

Freeze the project Skill and independent verifier before a run. Let the evaluating conversation investigate and repair only the sandbox, without reading evaluator-owned checks or previous answers. Run `node scripts/verify-investigation-workspace.mjs <completed-workspace>` yourself. Its seven groups use promise gates for scheduling and a bounded test timeout for incomplete execution. Only a zero exit with all seven passing and no cancelled groups establishes acceptance. A failed or cancelled check is retained as evidence, including before a fix.

If an independent check exposes a remaining defect, give the conversation the concrete failing observation and expected behavior, without prescribing the implementation. Record whether it revises its hypothesis, reuses valid prior findings and tests, changes the method to address the actual gap, and stops when acceptance passes. If it passes immediately, report that result; do not manufacture another failure to obtain an escalation example. Distinguish reading the guidance from demonstrating its effect. A difficult test alone does not establish that the agent needed a Skill.

This is an explicit-entry usability and correctness experiment. A reused conversation and synthetic, fully specified contract limit generalization. It does not by itself compare default Codex, establish implicit activation, measure token savings, or show that every stated adaptation rule was exercised. Improve guidance only for an observed, attributable gap; successful runs need not produce another instruction change.

## Staged acceptance changes

`node scripts/create-stream-workspace.mjs <fresh-workspace>` creates a JSON Lines import task involving arbitrary UTF-8 byte boundaries, final-line handling, error recovery, concurrent invocations and source failures. Phase one explicitly accepts replacement characters for malformed UTF-8. Run `node scripts/verify-stream-workspace.mjs <workspace>` for its six independent groups. Existing directories are rejected.

After phase one meets its own contract, freeze that implementation and its tests. A controlled second request changes the default to rejecting malformed UTF-8 and adds `importRecords(chunks, { invalidUtf8: 'replace' })` for compatibility; `'reject'` is also valid. All other values supplied for this field are invalid and must reject before source consumption. Preserve the other phase-one behavior. Provide this change explicitly, without presenting it as a previously hidden requirement or pretending the earlier implementation failed its original task. Run the frozen verifier with `--strict`: six compatibility groups and three new groups must all pass, with no cancellations.

Record which prior conclusions and assertions cease to apply, which remain valid, what is changed or reused, and whether the agent requests unnecessary approval or expands scope. A failure against the new contract before it is implemented is expected, not evidence of agent error. If a repair still fails the stated new contract, provide concrete observations and check whether the next investigation changes accordingly. Preserve each version and its raw output. Keep the independent checks and reference implementations outside the evaluating conversation's permitted workspace.

This tests adaptation to a disclosed requirement change. It does not manufacture an incorrect agent hypothesis, prove recovery from a spontaneously wrong fix, or establish the Skill's causal benefit. Evaluate those separately when observed. Give an independent evaluator only necessary raw artifacts; do not instruct it which method or implementation to choose.

## Conversational visibility

Inspect actual progress messages alongside tool records and acceptance results. Look for concrete findings linked to a justified method and next check, truthful Skill adoption, explanations of changed decisions and retained work, and delivery statements bounded by completed verification. These should appear during the work, rather than only in an evaluator's retrospective. A short direct fix may reasonably need only an action and result update.

Include both a bounded edit and an investigation, plus a disclosed requirement change when testing adaptation. Preserve stage-one code, checks and messages before issuing stage two. Independently verify each acceptance contract. Audit whether claimed Skill reads and results actually occurred; distinguish considering a candidate from adopting it, and distinguish a failed first assertion from later assertions that never ran. Also check for unnecessary approval questions, repeated banners, invented gaps, scope expansion or extra artifacts merely to display activity. Do not require exact wording, a fixed number of updates, a particular Skill or all stages on every task.

Explicitly loading updated guidance is a positive control for readability and adherence. It does not establish implicit activation or prove that the Skill caused better outcomes. Reused conversations, known tasks and general host instructions further limit causal conclusions. Visible messages alone are insufficient: judge whether they help explain real decisions and whether the requested work is correct.

## Comparative trials

### Operational references and handoff

Evaluate the investigation, capability-selection and continuity references through an independent task, rather than assertions that their prose contains particular phrases. One useful design uses the asynchronous resource-cache contract above and includes plausible optional capabilities with different prerequisites and costs. Keep the capability catalog identical across arms. Let the host decide whether any candidate helps; do not require invoking a particular skill or discovering all candidates.

Ask for a compact handoff record only when the task actually includes a handoff. Preserve the first accepted implementation and tests before issuing a disclosed second-stage requirement, such as explicit invalidation of a cache entry without cancelling outcomes for existing callers. If files changed between stages, disclose the change and preserve its exact diff. Judge which evidence the host rechecks, which work it retains, and whether it correctly limits file-state claims. A fingerprint match alone cannot establish the new contract.

For an old/new guidance comparison, freeze both complete skill directories, use fresh CLI homes and independent Git roots, hold model settings and prompts constant, and inspect actual catalog and skill reads. Keep evaluators outside the permitted task workspace and independently check both stages. Record rejected or unavailable candidates truthfully. A single synthetic pair can demonstrate usability and exercised behavior; it cannot establish a causal quality gain, performance improvement or activation in the current desktop session.

The helper's implementation tests separately cover explicitly selected files, changes and missing files, invalid records, exclusive creation, project binding and redirected paths. Integration tests verify portable asset copies, readable resource links, whole-plan conflict checks, backups and repeat installation. These checks complement behavior trials; they do not prove that a host will choose a reference in every suitable task.

### Recorded operational-method trial: 2026-10-11

A matched old/new skill pair used the resource-cache task, the same optional candidate catalog and a requested handoff. Each arm ran in its own fresh CLI home and Git root with the same inherited `gpt-6.1-sol`/`high` settings. Both independently passed all seven original-contract groups, then all twelve groups after a disclosed synchronous-invalidation requirement. Both retained the exact first-stage test-file bytes, used deterministic ordering probes and avoided unrelated gateway or formal-delivery workflows.

The new arm read the three operational references, saved selected-file fingerprints and checked them at resume. It distinguished a disclosed comment-only change from a behavioral change, and correctly limited earlier tests to the original contract. It used Node crypto directly; this does not demonstrate adoption of the optional helper. The old arm also reached the correct continuity decision through code and context.

Observed total wall time was 234.243 seconds for the old arm and 333.918 for the new arm. Cumulative input counters were 387,776 and 568,075 tokens respectively; uncached input was 49,472 and 67,339, and output was 9,860 and 14,115. Second-stage counters include the first stage. The new run consumed more time and tokens while independent acceptance was equal. Concurrent execution, one synthetic pair, explicit invocation and reused staged conversations prevent a general speed, quality or causal claim. This run establishes exercised methods and correctness for the tested contract, not superiority over default Codex or activation in an existing desktop session.

Run paired trials on clean copies of representative real tasks, with the same model/settings/tools/constraints and repeated runs. Compare default Codex, adaptive integration, and explicitly configured framework workflows. Keep prompt wording and acceptance tests consistent; include both small edits and difficult investigations, missing capabilities and misleading Skills.

Measure acceptance-test correctness, regression defects, scope creep, rework, elapsed time, user interruptions, and observed token usage when the platform exposes it. Treat reading and chained Skill costs as part of total execution cost. Count failed and incomplete runs, and document unavailable metrics. Do not use the number of invoked Skills or completed workflow stages as the target metric.

Native catalog success on one machine demonstrates that executable/version's protocol compatibility. Cross-platform CI checks portable code and policy; it does not install Codex or certify desktop plugin/session equivalence. External workflow interoperability requires separate, version-pinned evaluations.
