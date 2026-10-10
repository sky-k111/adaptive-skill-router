---
name: adaptive-workflow
description: Select or revise a development method when focused exploration leaves an unresolved cause, requirement, coordination, verification, or review gap. Explain material decisions and verify the requested outcome. Clear, bounded edits normally proceed directly.
---

# Adaptive Workflow

Complete the requested development work using the least process sufficient to establish correctness. Base method selection on observed gaps and consequences. Preserve the user's goal, applicable project requirements, existing authorization and valid prior work.

## Applicability and scope

Apply this guidance to software development. A task's size, a defect label, or an available capability does not by itself justify additional workflow. Explicit invocation activates this guidance; it does not require another skill, a plan, a new test framework or delegated work.

Establish the requested outcome, permitted changes and relevant acceptance criteria. Do not turn optional improvements into required delivery, alter unrelated configuration, or broaden scope to accommodate a preferred method.

## Establish evidence before choosing a method

Inspect the relevant implementation, reported behavior and existing checks. Use a minimal reproduction when needed. Investigate unknowns that can change the next decision; a whole-repository audit is not required.

Separate observed facts, hypotheses and unresolved requirements. A passing check proves only the behavior it exercises. Do not claim that unexecuted assertions passed, including assertions skipped after an earlier failure.

Proceed when the evidence establishes the cause or intended behavior, the affected boundary and a useful verification approach. Otherwise identify the specific gap before adding process. Do not substitute elapsed time, file counts or subjective confidence for evidence.

## Choose the smallest sufficient method

| Established condition | Appropriate response |
| --- | --- |
| Behavior, cause, scope and verification are clear | Implement directly and run relevant checks |
| A cause is unproven, behavior is intermittent, or a hypothesis fails | Reproduce, observe the relevant boundary and test a discriminating hypothesis |
| Existing checks miss significant behavior or regression risks | Add focused behavior checks; use test-first work when it resolves the gap |
| An unresolved requirement changes the delivered behavior | Investigate available evidence; ask for the missing business decision when necessary |
| Actual interface coordination, dependencies or continuity require a durable record | Keep only the plan, specification or acceptance record needed to coordinate the work |
| A change has material consequences for interfaces, permissions or data integrity | Verify the affected risks and use additional review when justified |

These are decision criteria, not sequential phases. Before adopting a method, identify the gap it addresses and consider its total cost, including required documents, tools and coordination. Continue using your own reasoning when it is sufficient.

## Use optional capabilities without creating dependencies

This skill must remain usable with the host's existing tools. No external skill, framework or CLI is required.

Reuse a reliable session catalog when it is sufficient. Discover additional capabilities only for a specific unresolved need. Metadata, retrieval scores and disk presence do not establish relevance, current session availability or permission to execute.

Before adopting another capability, read its relevant instructions and check required tools, project setup and downstream work. Load only necessary resources. If prerequisites are unavailable, explain the limitation and use a viable approach within existing authorization. Do not install or initialize external dependencies without authorization for that action.

Resolve workflow conflicts under the applicable instruction hierarchy, user goals and project constraints. Preserve required checks. If borrowing only part of a method, describe the part actually used; do not claim full execution. Do not rewrite another capability or its invocation policy to remove a conflict.

## Explain material decisions during the work

Communicate in the user's language. At meaningful decisions or milestones, connect the relevant observation or unresolved gap to the selected approach, next action and behavior to verify. Limit claims to the scope actually inspected.

When using this guidance, identify Adaptive Workflow once in the first substantive update alongside the evidence and decision it supports. This makes actual adoption visible without a separate activation banner. If it was only considered, describe it as a candidate rather than an active method.

When adopting an optional capability, identify what was adopted, why it helps and which parts are used. Distinguish consideration, intended use and actual adoption. Do not announce an invocation before reading the required instructions.

When evidence or requirements change, explain the affected decision, the work that remains valid and the next decisive check. Report substantive results as they become available, not solely in a retrospective summary.

Keep these updates proportionate. A bounded edit may need only a short action and result update. Do not impose a fixed message count, repeat workflow banners, narrate every tool call, create display-only reports or invent uncertainty to make the skill noticeable. Explanations do not introduce new approval gates.

## Adapt without restarting

Refresh affected findings and acceptance criteria when code, requirements or observations change. Distinguish a newly requested contract from failure against the original contract.

Retain still-valid evidence, completed changes and useful checks. Escalate only to address a demonstrated gap; reduce process once uncertainty resolves. Do not repeat investigations or regenerate equivalent artifacts merely because the method changes.

If repeated attempts produce no new evidence, change the investigation approach. Continue authorized work autonomously; ask when a required business decision, permission or information is genuinely missing. Use delegated work only when current instructions permit it and its expected value warrants coordination cost.

## Verify and finish

Verify the requested behavior and relevant risks using appropriate checks. Follow required project validation. Reuse sufficient existing checks; extend coverage for actual gaps rather than to satisfy a process quota.

Distinguish passed, failed, incomplete and unrun verification. Delivery must explain the actual change, evidence supporting acceptance and material remaining limitations. Do not claim comparative quality, speed or token savings without suitable comparative evidence.

Stop adding work when the acceptance criteria are satisfied and relevant risks have been reasonably checked. Retain necessary authorization boundaries for destructive changes, production actions and sensitive data or permissions. Selecting a method never grants additional authority.
