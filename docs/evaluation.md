# Engineering validation and historical evidence

`npm run check` runs implementation tests and ten deterministic evidence-policy scenarios. Passing them establishes expected behavior for those inputs, not improved agent intelligence or lower token cost.

## Current development priority

Harden shipped behavior before adding features. Further comparisons against default Codex are paused. Historical reports and procedures below preserve prior evidence; they are not instructions to launch new comparative campaigns or a prerequisite for routine maintenance.

- Discovery: verify input rejection before I/O, invocation restrictions, retained local results after online failure, bounded requests and actionable errors that do not expose raw transport details.
- Source collection: verify commit and blob identities, useful partial results, shared references and cycles, genuine depth/budget failures, and the distinction between collected material and reviewed instructions.
- Project integration: preserve user content, reject conflicts and stale previews, maintain backups and check repeated application.
- Distribution: keep portable resources synchronized and inspect package contents for private configuration, raw evidence and generated workspaces.

Regression tests now cover a collected shared reference incorrectly reported as a depth-limit gap, cleanup failures masking HTTP diagnostics or stopping a permitted redirect, and raw transport/body errors escaping through search results. These use controlled responses and exercise existing contracts without invoking an agent or relying on registry availability.

## Current checks

The previous [discovery tooling and actual maintenance report](discovery-validation-2026-10-15.md) ([中文](discovery-validation-2026-10-15.zh-CN.md)) records live source collection, explainable reranking, 140 passing local implementation tests at that revision and an eight-session comparison. Both arms accepted 4/4; Adaptive used 24.1% more uncached input in that sample. No reliable quality or cost advantage was established. Its test count describes that recorded revision, not the current suite.

Implementation tests cover malformed metadata, aliases and Unicode, duplicate names, symlink/junction loops, invocation restrictions, disabled configuration, cache uncertainty, source changes, exploration-first routing, evidence binding, explicit choices, safe previews, backups and idempotent integration. Some systems cannot create file symlinks; that check explicitly reports a skip while directory-link checks can still run.

The ten policy scenarios include a clear bug, a large mechanical edit, an unknown root cause, missing regression coverage, interfaces spanning modules, a high-consequence one-line change, a business unknown, unknown scope, and de-escalation after resolution. Fixtures offer narrow debugging/testing/planning methods and a deliberately overbroad workflow. A broad trigger alone never creates a method gap or final selection; matched broad candidates retain an advisory for the host.

## Discovery implementation checks: 2026-10-15

The discovery tests cover source-bound remote identities, duplicate and malformed entries, owner restrictions, input validation before I/O, response-size limits, restricted redirects, network errors, request/body timeouts and schema changes. Controlled HTTP responses make these tests independent of registry availability. CLI checks cover local-only defaults, successful online metadata, explicit-only/disabled local states, standalone helper parity, no installation writes and retained local results with exit code 2 after registry failure. Integration checks cover both distributed copies, relative links, backups, conflict detection and idempotent installation of the new resources.

These are implementation checks, not comparative agent-quality evidence. The host still chooses semantically after reviewing exact source instructions and prerequisites; a shortlist or lexical score is not a final selection. Initial live requests failed during the TLS connection. The later live validation below records successful requests and remaining connection instability. No third-party skill was installed for these checks and no new token-saving or superiority claim follows from them.

Both skill metadata blocks were checked with the repository's YAML parser and 52 relevant relative links resolved. The skill-creator Python validator could not start because PyYAML was unavailable; it was not counted as passed. Package dry-run inspection included both self-contained discovery helpers and their type declarations. The updated installed copy was checked against the source, with the prior six-file version backed up privately.

### Live discovery and source review: 2026-10-15

The actual task was to validate discovery for this Node CLI's testing and delivery work without introducing a new test framework. Local `verification` discovery returned the available verification-before-completion skill and other candidates; its actual instructions were read. It was adopted for fresh checks before delivery. Local `node cli testing` discovery found no lexical matches; the same query's online search and the standalone helper both returned five real registry candidates. Their lists differed, and both successful remote requests recorded one connection retry. Results are not a stable ranking or a semantic recommendation.

The source review rejected a Capacitor delivery workflow: its [actual instructions](https://github.com/cap-go/capgo-skills/blob/main/skills/capacitor-ci-cd/SKILL.md) concern mobile build/signing rather than this CLI. A more relevant [Node CLI candidate](https://github.com/lirantal/nodejs-cli-apps-best-practices/blob/e6374e4f64a4708cc01d3a398cb15e532ab3d847/skills/nodejs-cli-best-practices/SKILL.md) required reading its supporting reference. That reference was fetched and read; only its configuration-precedence and actionable-error techniques were borrowed. Its full audit workflow was not invoked, no new framework or third-party skill was installed, and its CC-BY-SA-4.0 source was not redistributed. A new behavioral test checks command-line/environment/private-project proxy precedence. This records a host judgment and partial technique use, not a claim that remote metadata automatically selected or invoked a skill.

The terminal initially bypassed an existing local proxy. Repository-local Git proxy/backend configuration restored a real push; process-scoped proxy support enabled registry access with certificate checks intact. The completed local/online/standalone smoke used a TLS 1.2 maximum compatibility setting for those test processes. Other attempts still experienced connection resets, including later source fetches; the supporting reference was successfully fetched through the host's browsing tool. This does not establish an exact TLS-version root cause or guarantee continued upstream availability. Failed attempts and successful JSON responses remain in private evidence. No proxy address or private configuration is shipped.

Additional implementation tests exercise real local HTTP CONNECT attempts, bounded connection retry, restored CLI networking state, sanitized invalid settings and offline independence. These complement the live smoke; neither test type establishes superiority over default Codex, implicit activation or general cost savings.

### Local inspection drift regression: 2026-10-15

Code inspection found that on-demand reads trusted a cached canonical path and only compared `SKILL.md` content. A retargeted directory link could therefore return the old target's instructions, while changes to `agents/openai.yaml` left invocation metadata stale. Before the fix, the regression run reported five failures: directory retargeting plus the added/changed/removed metadata group and its three subtests, all from missing expected rejection. This is a reproducible implementation defect, not an observed comparative agent-quality result.

Local candidates now expose `inspectionFingerprint`; CLI `inspect --expect` binds the later read to that token. Tests cover identical-content directory and metadata redirection, metadata lifecycle and dependency changes, source changes between separate CLI calls, normalized line endings, legacy catalogs, missing files and successful rediscovery. The complete check run passed 97 tests, skipped two file-symlink checks due to platform permissions, and passed all ten policy scenarios.

A separate local smoke used the actual installed Adaptive Workflow manifest and invocation metadata. Discovery and token-bound inspection matched the installed instructions. A disposable copy then received an explicit-only policy: inspection using the old token exited 1 with no source body; rediscovery returned `explicit-only`, and inspection using the new token succeeded. The original installed manifest and metadata remained unchanged. Raw outputs and the disposable copy stay outside distributed files.

The token covers entry instructions, resolved paths and optional invocation metadata. It does not pin supporting scripts/references, authenticate publishers, lock the filesystem or establish current desktop permission state. This regression does not establish better task outcomes, lower costs or remote registry availability.

## Historical behavior procedures and results

The remaining sections retain earlier evaluation methods and observations for traceability. Current maintenance uses the engineering checks above; no new baseline comparison is scheduled.

### Independent behavior smoke test

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

A [repeated sixteen-conversation trial](benchmark-2026-10-11.md) ([Chinese report](benchmark-2026-10-11.zh-CN.md)) records a bounded benefit with a shared process-skill library, repeated forced-workflow review waits and negative bare-Codex comparisons. The positive result concerns explicit use on a clear repair: it is not an installation, latency or general-quality guarantee.

A [six-conversation real-project trial](real-project-2026-10-11.md) ([Chinese report](real-project-2026-10-11.zh-CN.md)) repaired archive validation and found post-hoc compatibility regressions. It records no stable superiority and a derived-cache preparation flaw that limits cost attribution. A targeted method correction was made only after the frozen comparisons completed.

A [frozen-version forward comparison](heldout-2026-10-11.md) ([Chinese report](heldout-2026-10-11.zh-CN.md)) used two actual source defects not involved in Skill design, with three configurations and two repetitions each. All twelve runs passed their fixed acceptance. Neither registered quality nor repeated input-reduction criterion was met. Copies and initial Git indexes were prepared before baseline tests, while shared dependencies and server caching remained uncontrolled. Tasks and detailed acceptance contracts were researcher-authored module repairs, not blind production sampling or whole-project evaluation.

### Operational references and handoff

Evaluate the investigation, capability-selection and continuity references through an independent task, rather than assertions that their prose contains particular phrases. One useful design uses the asynchronous resource-cache contract above and includes plausible optional capabilities with different prerequisites and costs. Keep the capability catalog identical across arms. Let the host decide whether any candidate helps; do not require invoking a particular skill or discovering all candidates.

Ask for a compact handoff record only when the task actually includes a handoff. Preserve the first accepted implementation and tests before issuing a disclosed second-stage requirement, such as explicit invalidation of a cache entry without cancelling outcomes for existing callers. If files changed between stages, disclose the change and preserve its exact diff. Judge which evidence the host rechecks, which work it retains, and whether it correctly limits file-state claims. A fingerprint match alone cannot establish the new contract.

For an old/new guidance comparison, freeze both complete skill directories, use fresh CLI homes and independent Git roots, hold model settings and prompts constant, and inspect actual catalog and skill reads. Keep evaluators outside the permitted task workspace and independently check both stages. Record rejected or unavailable candidates truthfully. A single synthetic pair can demonstrate usability and exercised behavior; it cannot establish a causal quality gain, performance improvement or activation in the current desktop session.

The helper's implementation tests separately cover explicitly selected files, changes and missing files, invalid records, exclusive creation, project binding and redirected paths. Integration tests verify portable asset copies, readable resource links, whole-plan conflict checks, backups and repeat installation. These checks complement behavior trials; they do not prove that a host will choose a reference in every suitable task.

### Recorded operational-method trial: 2026-10-11

A matched old/new skill pair used the resource-cache task, the same optional candidate catalog and a requested handoff. Each arm ran in its own fresh CLI home and Git root with the same inherited `gpt-6.1-sol`/`high` settings. Both independently passed all seven original-contract groups, then all twelve groups after a disclosed synchronous-invalidation requirement. Both retained the exact first-stage test-file bytes, used deterministic ordering probes and avoided unrelated gateway or formal-delivery workflows.

The new arm read the three operational references, saved selected-file fingerprints and checked them at resume. It distinguished a disclosed comment-only change from a behavioral change, and correctly limited earlier tests to the original contract. It used Node crypto directly; this does not demonstrate adoption of the optional helper. The old arm also reached the correct continuity decision through code and context.

Observed total wall time was 234.243 seconds for the old arm and 333.918 for the new arm. Cumulative input counters were 387,776 and 568,075 tokens respectively; uncached input was 49,472 and 67,339, and output was 9,860 and 14,115. Second-stage counters include the first stage. The new run consumed more time and tokens while independent acceptance was equal. Concurrent execution, one synthetic pair, explicit invocation and reused staged conversations prevent a general speed, quality or causal claim. This run establishes exercised methods and correctness for the tested contract, not superiority over default Codex or activation in an existing desktop session.

Earlier comparative trials used clean copies of real tasks with matched model/settings/tools/constraints and repeated runs, comparing default Codex, adaptive integration and explicitly configured framework workflows. Their procedures and acceptance limits remain recorded in the linked reports. Further such comparisons are paused.

Measure acceptance-test correctness, regression defects, scope creep, rework, elapsed time, user interruptions, and observed token usage when the platform exposes it. Treat reading and chained Skill costs as part of total execution cost. Count failed and incomplete runs, and document unavailable metrics. Do not use the number of invoked Skills or completed workflow stages as the target metric.

Native catalog success on one machine demonstrates that executable/version's protocol compatibility. Cross-platform CI checks portable code and policy; it does not install Codex or certify desktop plugin/session equivalence. External workflow interoperability requires separate, version-pinned evaluations.
