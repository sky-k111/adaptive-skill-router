# Discovery tooling and actual maintenance comparison

[中文报告](discovery-validation-2026-10-15.zh-CN.md)

The engineering changes work for the recorded cases. The eight-session maintenance comparison did **not** establish an agent-quality or cost advantage: Bare and Adaptive each passed 4/4, while Adaptive used 347,193 uncached input tokens versus Bare's 279,662, **24.1% more in this sample**. This observation is not a causal price or general efficiency estimate.

## Retrieval and actual source collection

The prior live `node cli testing` response placed the Node CLI candidate third, after a browser candidate and a mobile-delivery candidate. Replaying that unchanged response with query-term coverage moved the Node CLI candidate to first. A fresh live request also succeeded: the provider returned the mobile candidate first and Node CLI second; reranking put Node CLI first. Original ranks, matched terms and coverage remained visible. This is a development regression on an observed case, not a held-out relevance benchmark or a precision/recall study. Zero-overlap candidates remain available unless explicit constraints filter them; semantic relevance still requires host review.

The new collector fetched these real public sources, pinned all fetched files to one commit, and verified blob identities:

| Candidate | Commit | Material collected | Host decision for this Node CLI |
| --- | --- | --- | --- |
| [Node CLI guidance](https://github.com/lirantal/nodejs-cli-apps-best-practices/blob/e6374e4f64a4708cc01d3a398cb15e532ab3d847/skills/nodejs-cli-best-practices/SKILL.md) | `e6374e4f64a4708cc01d3a398cb15e532ab3d847` | Entry, CC-BY-SA-4.0 license and required supporting reference: 3 files | Borrow relevant techniques or decline when ordinary reasoning is sufficient; no full audit or installation |
| [Mobile delivery workflow](https://github.com/cap-go/capgo-skills/blob/1303813625c4ea04a444f17fe203c4f36565c6f1/skills/capacitor-ci-cd/SKILL.md) | `1303813625c4ea04a444f17fe203c4f36565c6f1` | Entry, MIT license and 5 supporting references: 7 files | Decline: actual scope requires Capacitor/native toolchains, signing and mobile distribution |

The repository CLI also completed a real pinned Node CLI collection. No TLS validation was disabled, no third-party skill was installed and no fetched script was executed. These requests succeeded during the recorded window; continued network availability is not guaranteed. Material collection always retains `reviewStatus: not-reviewed`: publisher trust, license applicability, semantic dependencies and host availability remain judgments. [Source collection](source-review.md) defines bounds and partial-failure behavior. Raw third-party bundles remain private.

## Frozen maintenance comparison

Two pre-existing defects in this repository supplied useful maintenance work rather than injected failures:

1. Commands silently accepted out-of-scope flags, such as `scan --write` and `init --native`. Invalid options must fail before file, native-catalog, network or write boundaries, preserving valid commands and help/version behavior.
2. The registry helper rejected an oversized declared response without cancelling its body. Cleanup must finish before reporting the size error, preserve that error if cleanup rejects, consume no body and cause no response retry.

Both frozen external checkers failed on the original implementation before any subject ran. Source copies, tasks, prompts, guide assets and evaluators were prepared before execution. Registration occurred at **2026-10-15T03:39:42.389Z**, with SHA-256 `94639171a3ce388473fd3627e8d23e2fccdda907b172b3263ba2e2c7c07b0aae`. The measured snapshot included the unreleased discovery changes before these maintenance fixes; it is not a clean checkout of an earlier published commit. The full hash manifest remains private.

The design was two tasks × two repetitions × two arms, exactly eight sessions, using Windows, Node.js 24.18.0, CLI 0.162.0, gpt-6.1-sol/high, independent Git roots and CLI homes, common bundled capabilities, neutral instructions and a 480-second cap. Bare had no optional workflow skill installed. Adaptive added only the frozen Adaptive Workflow and an explicit invocation prefix. All workspaces exposed identical product source and the same actual public-source bundles. Task instructions required evaluating whether those candidates could help, and allowed declining both. Network discovery was disabled for subjects so material and connection variability would not confound this maintenance comparison; live collection was validated separately.

All sessions ended naturally. Native records confirmed actual Skill-body injection in all four Adaptive sessions and none in Bare. Model/reasoning/approval settings remained as registered, temporary authentication files were removed, and original protected tests, fixtures and unrelated source retained their hashes. Command audits found no reads of the frozen external evaluators. This is an audited instruction boundary, not an operating-system security sandbox.

## Results

| Task/repeat | Arm | Accepted | Input | Cached input | Uncached input | Output | Observed seconds |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| flags 1 | bare | Yes | 704,274 | 643,584 | 60,690 | 10,980 | 351.539 |
| flags 1 | adaptive | Yes | 831,780 | 710,528 | 121,252 | 12,595 | 361.907 |
| flags 2 | bare | Yes | 940,106 | 850,176 | 89,930 | 12,042 | 326.801 |
| flags 2 | adaptive | Yes | 1,155,901 | 1,092,736 | 63,165 | 12,590 | 383.131 |
| response 1 | bare | Yes | 797,005 | 728,448 | 68,557 | 10,971 | 267.901 |
| response 1 | adaptive | Yes | 971,569 | 875,392 | 96,177 | 9,796 | 313.480 |
| response 2 | bare | Yes | 672,069 | 611,584 | 60,485 | 8,290 | 246.142 |
| response 2 | adaptive | Yes | 786,215 | 719,616 | 66,599 | 10,631 | 311.453 |

Acceptance included the frozen external behavior checks (11 for flags, 9 for response cleanup), a fresh build, each delivered workspace's regression suite and all ten policy scenarios, preserved protected inputs and the requested delivery record. Verification was rerun with the same external temporary-root arrangement for every cell. Some subjects' own test runs used a temporary root inside their Git workspace, causing an existing non-Git-discovery test to fail for environmental reasons; those self-reports were retained, not relabeled as passing. Fresh evaluator-run checks outside that Git ancestry passed. All eight sessions declined the mobile workflow; Node CLI techniques were borrowed or declined according to the task. These decisions were not unique to Adaptive.

Totals were 3,113,454 input / 279,662 uncached input / 42,283 output for Bare, and 3,745,465 / 347,193 / 45,612 for Adaptive. Counters cover all observed work, not just reading instructions. The preregistered directional quality signal required Adaptive 4/4 and Bare at most 2/4; the repeated cost signal required at least 30% lower uncached input in both repetitions of a task. Neither was reached. No retries, replacement tasks or post-registration guidance tuning were used to seek a favorable result.

## Delivered changes and limits

The first independently accepted Adaptive repair for each task was integrated, then checked with the new discovery/source features: **140 tests passed, 2 file-symlink tests skipped on the local Windows host, and 10/10 policy scenarios passed**. Patch selection does not establish superiority over the equally accepted Bare repairs. Installed resources were backed up, checked for custom edits and verified against all ten canonical resources. Distributed packages exclude source bundles, raw model logs, private configuration and behavioral workspaces.

The first publication's Node 22 CI exposed an integration-test assumption: a valid source proxy flag was expected to reach networking even though explicit proxy setup requires Node 24.14+. The test now verifies the documented prerequisite error on older runtimes and the guarded boundary where supported. The product's version requirement was retained. This correction does not alter the frozen subject runs or their outcomes.

This remains a small, author-selected comparison on this product, with explicit contracts, known defects and curated source candidates. It is not held-out, blinded, independent production sampling, automatic desktop activation or an end-to-end live network comparison. Shared dependencies, provider caching and concurrent pairs limit cost/time interpretation. More general workflow instructions are not supported by these results. The demonstrated engineering contribution is explainable retrieval, bounded pinned source material and tested failure handling; reliable default-Codex superiority remains unproven. Earlier [held-out negative findings](heldout-2026-10-11.md) remain published.
