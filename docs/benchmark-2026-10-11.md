# Repeated trial: selective workflow with a process-skill library

## Finding

On a bounded two-function repair with thirteen installed process skills, explicit use of Adaptive Workflow reduced reported uncached input tokens by **56.1% and 39.4%** in two fresh matched comparisons. Both sides passed all three independent acceptance groups and retained the original test assertions. Reported total input, including cached input, fell by **35.6% and 22.9%**. This is a bounded efficiency observation, not a general quality, latency or price claim.

The positive comparison did **not** instruct the ordinary-library arm to plan or invoke every skill. It exposed the same thirteen unchanged process skills to both arms; the adaptive arm additionally installed and explicitly invoked Adaptive Workflow. Actual tool records show that the ordinary-library arm read several debugging, testing and verification guides, whereas the adaptive arm read the common entry guidance and Adaptive Workflow, inspected the small implementation and proceeded directly. No required project checks were removed.

## Design and stopping rule

The skill was frozen from commit `230840c07d72b306db008e1f31ca9980e327e26b`. All runs used Codex CLI `0.162.0` and inherited `gpt-6.1-sol`/`high` settings, fresh CLI homes, independent Git roots, the same tools and a neutral project boundary. Personal adaptive instructions and parent integration blocks were absent from the audited contexts. Original test assertions were retained: one original file was extended by appending tests without changing its original bytes, while the others remained unchanged. Installed skill bodies matched the frozen copies. These are instruction and CLI-home controls, not operating-system isolation.

Two scenarios were registered before their runs, each repeated twice across bare Codex, Adaptive Workflow alone and deliberately forced planning/execution: twelve conversations. Before running an additional control, four same-library conversations were registered to separate workflow selection from merely having fewer skills installed. All sixteen results appear below, including negative and incomplete outcomes.

An advantage required repeated independent acceptance differences, or at least 30% less uncached input in **each** of two accepted comparisons. A separate criterion recorded recurring process-induced review waits. The protocol stops after the registered matrix; it does not search indefinitely for a winning sample.

The bounded task corrects a heading and preserves exact path strings instead of returning basenames. The handoff task repairs a serial queue after its implementation changes: original task outcomes, recovery after failure, no argument leakage, drain snapshots and a stable close promise are all explicit in the current contract. The historical checkpoint's old source fingerprint and one passing smoke test are genuine; they do not certify the changed implementation. The evaluator checks ten independent groups, including controlled ordering. A known-correct reference passed ten groups; the original broken fixture passed two and failed eight.

## Same-library comparison

| Repeat | Ordinary library: uncached input | Adaptive library: uncached input | Reduction | Ordinary/adaptive independent acceptance | Skill-read commands: ordinary/adaptive | All command executions: ordinary/adaptive |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| 1 | 23,426 | 10,281 | 56.1% | 3/3 and 3/3 | 6/2 | 13/8 |
| 2 | 18,436 | 11,173 | 39.4% | 3/3 and 3/3 | 4/2 | 12/7 |

A skill-read command can read more than one file or repeat a file. These are observed commands, not unique skills, invocations or required quotas. Counts help explain the token difference but are not the success metric.

## Complete outcome and usage table

“Default” has the host's built-in skills but no optional workflow package. “Adaptive” adds only Adaptive Workflow. “Library default” adds the thirteen process skills without a forced workflow instruction. “Library adaptive” adds Adaptive Workflow to that same library. “Forced workflow” has the library and explicitly requests complete planning followed by execution, even for the bounded edit.

| Scenario | Repeat | Arm | Independent acceptance | Total input | Cached input | Uncached input | Output | Wall seconds |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| bounded | 1 | Default | 3/3 | 77,171 | 69,760 | 7,411 | 684 | 53.986 |
| bounded | 1 | Adaptive | 3/3 | 91,301 | 78,208 | 13,093 | 829 | 55.440 |
| bounded | 1 | Forced workflow | 0/3; review wait | 169,378 | 147,200 | 22,178 | 3,460 | 106.295 |
| bounded | 1 | Library default | 3/3 | 214,274 | 190,848 | 23,426 | 1,184 | 61.767 |
| bounded | 1 | Library adaptive | 3/3 | 137,897 | 127,616 | 10,281 | 1,012 | 60.339 |
| bounded | 2 | Default | 3/3 | 76,382 | 67,072 | 9,310 | 613 | 44.633 |
| bounded | 2 | Adaptive | 3/3 | 90,841 | 83,456 | 7,385 | 824 | 51.338 |
| bounded | 2 | Forced workflow | 0/3; review wait | 207,718 | 172,160 | 35,558 | 6,226 | 142.737 |
| bounded | 2 | Library default | 3/3 | 187,652 | 169,216 | 18,436 | 1,140 | 52.100 |
| bounded | 2 | Library adaptive | 3/3 | 144,677 | 133,504 | 11,173 | 1,039 | 54.829 |
| handoff | 1 | Default | 10/10 | 124,845 | 111,616 | 13,229 | 4,091 | 139.276 |
| handoff | 1 | Adaptive | 10/10 | 132,554 | 102,400 | 30,154 | 5,232 | 141.907 |
| handoff | 1 | Forced workflow | 2/10; review wait | 267,127 | 236,160 | 30,967 | 6,729 | 189.896 |
| handoff | 2 | Default | 10/10 | 106,288 | 95,104 | 11,184 | 3,718 | 104.793 |
| handoff | 2 | Adaptive | 10/10 | 163,547 | 145,024 | 18,523 | 5,926 | 142.496 |
| handoff | 2 | Forced workflow | 2/10; review wait | 214,473 | 189,056 | 25,417 | 5,420 | 144.538 |

4 of the four forced-workflow turns exited normally after requesting plan review, with the implementation unchanged. They are incomplete product tasks, not CLI crashes. The review-wait runs generated planning/specification files; the accepted bounded runs modified only the requested implementation. Their review gate comes from the deliberately requested workflow. This demonstrates the consequence of applying that workflow to these tasks; it does not represent the workflow's normal use or establish that third-party skills are generally harmful.

The adaptive arms did not also receive the forced-workflow request. This compares method choices; it is not evidence that the skill should override a workflow explicitly chosen by the user. The same-library comparison above avoids that forced-workflow intervention.

## Negative findings and limits

Adaptive Workflow alone did **not** show a repeated acceptance or cost advantage over bare Codex in these cases. Both repaired both contracts. In particular, the handoff reference produced a validity check but did not establish a unique correctness benefit. The earlier old/new trial also had equal acceptance and higher cost for the newer guidance. Those negative observations remain part of the evidence.

The demonstrated benefit is selective use of a sizeable process-skill library for an already clear repair. It does not establish improved agent intelligence, generally better code, universal token savings, lower billed cost or faster completion. Wall time was not consistently lower and concurrent execution is not a latency benchmark. Cached and uncached counts are shown separately; each conversation has one turn, and counters are not summed across resumed phases.

There are only two repeats per comparison and synthetic, fully specified tasks. The shared thirteen-skill library was frozen from an installed collection, not sampled from all possible collections. Explicit entry is a positive control, not proof of implicit selection merely from installation. The fresh CLI process is not the exact running desktop session. Equivalent global instructions may reduce the additional benefit; this trial intentionally excludes them to distinguish the tested treatments.

Raw event streams, exact prompts, input hashes, frozen skills, source changes, acceptance TAP and context audits remain local. They contain machine paths and are not distributed. The public table records all registered outcomes without publishing private configuration or copied third-party assets.

## Supported product positioning

Use this skill as a conditional method-selection layer when broad workflow triggers or available process skills cause unnecessary reading, planning or review gates. Keep clear edits direct and preserve required validation. Do not market it as a general intelligence upgrade over bare Codex. Further development should shorten the common entry, preserve useful conditional references and add a capability only after a baseline failure demonstrates the gap; validate changes on a held-out task before expanding claims.
