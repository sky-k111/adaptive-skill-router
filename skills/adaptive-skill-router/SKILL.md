---
name: adaptive-skill-router
description: Choose and coordinate already-installed Codex skills when candidate fit, overlapping workflows or invocation cost needs judgment. Clear tasks can proceed without an additional skill. External discovery and installation are outside the default workflow.
---

# Adaptive Skill Router

Help Codex use its installed skills appropriately for the current task: decide whether a skill helps, choose the relevant capability, coordinate overlapping instructions and stop unnecessary follow-on work. Preserve the user's requested outcome and existing authorization.

## Scope

Use this guidance when the user asks how to use installed skills, several plausible skills overlap, or selecting one requires checking fit, prerequisites or downstream obligations. An explicit request to use a particular skill is a user choice to honor, subject to applicable constraints; do not silently replace it with your preferred workflow.

For a clear task that existing reasoning and tools can handle, proceed directly. Do not load this manager, scan every installed skill or introduce a plan merely to demonstrate routing. This guidance supports the host's decisions; it is not a global scheduler and does not change Codex's discovery, permissions or automatic invocation mechanism.

## Choose from what is already available

Establish enough task context to identify the needed contribution and constraints. For a code repair, inspect relevant behavior and checks; for a request to list or explain installed skills, use the catalog without requiring unrelated code exploration.

Reuse the current session's catalog first. Shortlist plausible descriptions, then read the selected candidate's actual instructions and necessary supporting resources before claiming adoption. Do not load every matching body. A lexical score, familiar name or broad trigger does not establish suitability.

Check what the candidate contributes, whether its tools and project prerequisites are available, and the work its required dependencies introduce. Keep identical names at different paths distinct. Disk presence does not establish current-session availability; respect disabled, explicit-only and unverified-cache restrictions. Reading instructions does not authorize their commands.

When fit or overlap remains uncertain, read [installed skill selection](references/capability-selection.md). Choose no additional skill when existing capabilities suffice or no available candidate fits. A missing candidate is not a reason to start an online search, install dependencies or modify other skills. Report a material limitation and continue with an available approach; external discovery requires a user request covering that work.

## Coordinate the selected skills

Prefer a candidate that directly supplies the needed contribution. When candidates overlap, compare their actual outputs, prerequisites and required downstream work rather than selecting all matches. Multiple skills are appropriate only for distinct contributions or a necessary dependency; connect their outputs instead of repeating investigation, planning or review already completed.

Read required downstream instructions only when their contribution becomes relevant. Do not recursively invoke this manager because another skill mentions routing, and do not invoke both equivalent manager entries for the same decision.

Resolve conflicts under the instruction hierarchy, explicit user choices and project constraints. Preserve required verification. If a self-contained technique can be borrowed without claiming to run a conflicting full workflow, state that limited use. Otherwise explain the incompatibility and use a viable alternative within existing authorization; do not silently skip mandatory requirements or rewrite the candidate's policy.

## Explain a material choice and reassess when needed

In the user's language, briefly connect the task need to the chosen skill and its contribution. When this guidance actually informs a selection, identify Adaptive Skill Router once with that decision. Distinguish a candidate being considered, instructions actually read and a capability actually used. Explain an important rejection or missing prerequisite when it changes the next action; an inventory, scorecard or fixed announcement format is unnecessary.

Reuse valid work. Reconsider the selection when the needed contribution is delivered, a prerequisite fails, or the task changes. End the additional workflow when its contribution is complete; do not continue into unrelated phases just because they appear in a skill. This does not waive required project checks or unfinished user requirements.

The existing [investigation](references/investigation.md) and [continuity](references/continuity.md) notes are optional fallbacks when an unresolved cause or changed evidence prevents deciding which installed capability is useful. They are not extra stages for every task. Stop at the requested outcome and report actual verification and remaining limitations.

## Optional local inventory tools

If the session catalog is insufficient and local inventory or version-bound inspection would help, read [CLI and evidence reference](references/routing.md). No CLI call or evidence file is required for an otherwise clear choice.
