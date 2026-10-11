# Real-project trial: archive validation

[中文报告](real-project-2026-10-11.zh-CN.md)

Six fresh Codex conversations repaired an existing archive-validation defect in the offline briefing subsystem of [GitHub Trending Digest](https://github.com/sky-k111/gh-trending-digest). All passed the frozen external checks, but additional compatibility review exposed regressions. This trial does **not** establish a stable quality or cost advantage for Adaptive Workflow.

## Actual defect and provenance

The source was the project's current local working tree, based on `d45d05d835e26626c203959440d8d288e5ec711f`, including existing uncommitted briefing development. It is not equivalent to checking out that public commit. Relevant application files, existing tests, fonts and sample archives were copied; no implementation defect was injected. Business `.env` files, private databases and production inputs were excluded.

An unchanged valid sample still passed `verify_archive()` after its declared PDF byte count was made incorrect. A malformed manifest could also escape as `TypeError`. Existing project tests passed 51/51. Before the model runs, an external evaluator found 24 failures and 22 passes, with one file-symlink check skipped for Windows permissions. A separately implemented calibration repair passed all 46 runnable external checks and the 51 original tests.

The task required strict structured-input validation, metadata consistency, portable filenames, size and hash verification, preserved historical schema 1/2/3 support, and rejection before invalid imports or restores write application state. Mandatory formats had specified filenames; optional entries remained supported. This is consistency validation, not archive authenticity or a signature scheme.

## Frozen comparison

Two repeats used three configurations:

- **Bare:** common bundled system skills, no optional process skills.
- **Library:** the same 13 existing process skills, selected normally; no forced planning prefix.
- **Adaptive:** the identical library plus explicit `$adaptive-workflow` invocation.

Model/settings were `gpt-6.1-sol` / `high`, Codex CLI `0.162.0`. Each conversation had a fresh CLI home and independent Git root, neutral task boundaries, the same application/test/fixture content, and a 720-second cap. The measured Skill was frozen from `cb7f9731dc28beff8693787c4168ebbeda00d727`; guidance was not changed within these six cells. Context audit found no personal adaptive rules or parent integration block. Original assertions and fixture bytes remained unchanged. Temporary CLI authentication was removed after each run.

Before execution, the quality criterion required Adaptive to pass both repeats while a comparison passed at most one. The cost criterion required accepted runs and at least 30% lower uncached input in both repeats. Both criteria failed.

| Repeat | Configuration | External checks | Project regression | Input | Cached input | Uncached input | Output | Observed seconds |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Bare | 46 pass, 1 skip | 211 pass, 3 skip | 830,552 | 759,040 | 71,512 | 15,549 | 403.480 |
| 1 | Library | 46 pass, 1 skip | 196 pass, 3 skip | 2,162,696 | 2,062,848 | 99,848 | 23,533 | 634.993 |
| 1 | Adaptive | 46 pass, 1 skip | 167 pass, 3 skip | 1,170,148 | 1,087,744 | 82,404 | 16,098 | 430.948 |
| 2 | Bare | 46 pass, 1 skip | 238 pass, 4 skip | 875,100 | 816,512 | 58,588 | 16,747 | 412.382 |
| 2 | Library | 46 pass, 1 skip | 199 pass | 1,421,850 | 1,325,440 | 96,410 | 21,179 | 551.278 |
| 2 | Adaptive | 46 pass, 1 skip | 206 pass, 3 skip | 1,142,152 | 1,062,912 | 79,240 | 20,099 | 557.105 |

Adaptive's observed uncached input was 17.5% and 17.8% below Library, but 15.2% and 35.2% above Bare. Total input was 45.9% and 19.7% below Library, and 40.9% and 30.5% above Bare. These are descriptive counters, not monetary savings or a causal effect estimate. Models added different tests; a larger test count does not establish better coverage.

## Preparation flaw and interpretation limits

Baseline checks started before copying all second-repeat workspaces had finished. Derived Python caches consequently entered their initial Git indexes: 23 files for Bare and 24 each for Library and Adaptive. All first-repeat indexes had zero such files. Application source, original assertions and fixtures matched their frozen hashes, but derived-cache tracking differed and participants spent effort on optional cleanup. Some cleanup attempts in repeat one were automatically rejected; participants still completed the repair.

This preparation flaw limits cost attribution. The second repeat is not a strict clean-workspace cost control. Preserve its outcomes rather than silently replacing them, and treat this round's cost numbers as observations. Server-cache behavior was also uncontrolled. Concurrent execution does not establish latency improvement. Instruction boundaries were not an OS sandbox. One issue and two repeats do not establish general superiority, and explicit invocation does not establish installation-only activation in a running desktop conversation.

The Library run with no project-test skips substituted simulated path-resolution checks for its permission-limited file-symlink cases. This does not establish successful real file-symlink verification. Every run's independent evaluator still reported the platform skip.

## Additional compatibility check, added after execution began

Independent review found that an optional Markdown entry could legally use a different portable filename. Both the original implementation and evaluator calibration accepted that variant. The task constrained generated filenames for the six mandatory formats, so extending the rule to optional Markdown introduced a regression.

This diagnostic was registered separately after the first Bare/Adaptive outputs were complete. It was run unchanged against every output. The original external evaluator remained frozen, and participants received no feedback from this diagnostic.

| Repeat | Bare | Library | Adaptive |
| --- | --- | --- | --- |
| 1 | Rejected valid optional filename | Preserved compatibility | Rejected valid optional filename |
| 2 | Rejected valid optional filename | Rejected valid optional filename | Preserved compatibility |

Passing the frozen suite therefore did not establish complete delivery correctness. Adaptive preserved this case once out of two, the same as Library; Bare preserved it zero times. This post-hoc check is a useful regression finding, not a preregistered or held-out causal-quality result.

## Delivery and targeted correction

A local repair copy and reviewable patch were retained from the first Library run, which passed the frozen checks, its complete regression suite and the additional compatibility diagnostic. The copied delivery was independently rerun: 196 passes, three permission-limited skips. It is not an Adaptive-exclusive achievement. The original project continued changing elsewhere, so the frozen repair was not applied over that working tree or published to its repository.

After the six comparisons completed, the Skill's investigation resource gained a narrow method for compatibility-sensitive restrictions: map a new rule to its actual scope, and test a valid counterpart that an overbroad fix would reject. Old acceptance alone does not establish validity under an explicitly changed requirement. The entry links this resource when required compatibility remains unverified, without imposing it on every change.

One additional fresh conversation forward-tested the updated guidance on a clean copy of the first Adaptive repair. Its prompt requested a pre-delivery review against the original task; it did not reveal the suspected regression or expected fix. The preparation excluded derived caches before creating the Git index. The conversation actually read the updated investigation resource, rejected an unsupported Unicode hypothesis after probing it, then reproduced the optional-filename regression. It changed one implementation line and added eight parameterized cases. All 22 existing functions in its additional test file remained unchanged; original tests and sample bytes also remained unchanged. Independent checks passed 46 with one platform skip, the optional-compatibility diagnostic passed, and the full project regression passed 175 with three permission-limited skips.

This seventh conversation demonstrates exercised guidance and a correction on a known case. The case informed the new guidance, the task was a review rather than an initial repair, and there was no matched old-guidance review control. It is not held-out evidence that the new Skill caused better quality or savings.

Raw conversations, prompts, source hashes, evaluator code, frozen skills, cache audit, compatibility results and the delivery patch remain local. Behavioral sandboxes, machine paths, authentication and third-party skill copies are not distributed with this project. The [earlier synthetic comparisons](benchmark-2026-10-11.md), including their bounded positive result and negative baselines, remain available; this real-project trial does not replace them.
