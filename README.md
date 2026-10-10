# Adaptive Workflow

**A standalone development skill for choosing methods from evidence, explaining decisions, and verifying outcomes.**

[Chinese documentation](README.zh-CN.md) · [Skill specification](skills/adaptive-workflow/SKILL.md) · [Evaluation](docs/evaluation.md) · [Contributing](CONTRIBUTING.md)

Adaptive Workflow helps Codex decide how to approach software development work after inspecting the relevant code, reported behavior and existing checks. It keeps clear changes direct, introduces additional methods for demonstrated gaps, and adjusts the approach when evidence or requirements change.

The skill is instruction-only. It works with the host's existing tools and has no required external skill, framework, service or command-line dependency.

## Core capabilities

| Capability | Behavior |
| --- | --- |
| Evidence-based method selection | Distinguishes observed facts from hypotheses and identifies the gap a method must resolve |
| Proportionate execution | Handles bounded changes directly; introduces planning, investigation, testing or review when justified |
| Visible decisions | Connects concrete findings to the chosen approach, next action and verification |
| Adaptation during execution | Updates affected decisions and acceptance criteria while preserving valid work |
| Optional capability reuse | Checks relevance, availability and prerequisites before adopting additional resources |
| Verifiable delivery | Reports actual changes, completed checks and remaining limitations, then stops at acceptance |

These capabilities are guidance for the host, not an autonomous task runner. The skill does not execute tools or select another capability outside the host's normal reasoning and permission controls.

## When to use it

Use it when exploration leaves an unresolved cause, a requirement that changes the solution, missing behavior coverage, an actual coordination need or a material review risk. It also applies when new evidence invalidates an earlier decision.

A clear local edit usually needs only implementation and relevant verification. Task size, file count and the presence of available skills do not automatically justify a larger workflow.

## Installation

In Codex, request installation from this repository:

```text
Install the standalone skill from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow.
```

Alternatively, copy the complete `skills/adaptive-workflow` directory to a supported skill location, such as `~/.agents/skills/adaptive-workflow`. Do not copy only the Markdown body. If the skill does not appear after installation, restart Codex. See [OpenAI's local skill documentation](https://learn.chatgpt.com/docs/build-skills).

Node.js is not required for the standalone skill. The repository's optional CLI has separate requirements.

## Usage

Explicitly request the skill alongside the development task:

```text
Use $adaptive-workflow to investigate this failure, make the necessary change, and verify the requested behavior.
```

Codex can also consider the installed skill when its description matches the task. Installation does not guarantee selection for every request. Project instructions and user requirements continue to govern execution.

### Try it on a real task

Start with a reproducible issue in your project. Include the observed behavior, expected result and a relevant command or test when available:

```text
Use $adaptive-workflow to fix this issue in the current project: [observed behavior]. Expected: [required behavior]. Reproduce with: [command or test].
```

Read the progress updates alongside the actual changes. You should be able to see which evidence supports the approach, why any additional method is needed, and what the checks establish. A clear fix may proceed directly. When the guidance is used, the first substantive update identifies Adaptive Workflow and the decision it supports.

If the requirement changes during execution, state the new behavior explicitly. The next update should explain the affected decision and which completed work remains useful. This is a practical way to inspect adaptation; it is not a benchmark against default Codex.

## What appears in the conversation

At meaningful decisions, progress updates explain:

- What the inspected evidence establishes and what remains unresolved.
- Why the chosen method is appropriate and what it will verify.
- How new evidence changes the approach and which work remains valid.
- What the completed checks establish and what has not been verified.

For example, an investigation may produce:

> The current test covers repeated reads for one account, but the cache key omits account identity. I will check cross-account results and load counts, then repair the affected boundary.

This is an illustrative update, not a fixed script. Small edits need fewer updates. The skill does not require repeated activation announcements, tool-by-tool narration or extra reports.

## Execution boundaries

The specification requires evidence before escalation, checks proportionate to the consequences, truthful reporting and reuse of valid work. It prohibits invented findings, unsupported invocation claims and scope expansion merely to accommodate a method.

Optional resources do not become mandatory dependencies. Their instructions must be inspected before adoption, and their prerequisites must be available. Using part of a method must be reported as partial use.

Method selection never grants additional authority. Required project checks and applicable permission boundaries remain in force. Once acceptance is satisfied, optional improvements do not become unfinished delivery.

## Repository structure

| Path | Purpose |
| --- | --- |
| `skills/adaptive-workflow/` | Standalone skill instructions and interface metadata |
| `skills/adaptive-skill-router/` | Optional project guidance for capability discovery and candidate retrieval |
| `src/` | Optional CLI implementation |
| `test/`, `fixtures/`, `examples/` | Implementation checks, test fixtures and evidence examples |
| `scripts/` | Reproducible evaluation tools |
| `docs/` | Architecture, CLI reference and evaluation limits |

The standalone skill does not depend on the project router. See the [optional router reference](docs/router.md) if local discovery or structured candidate retrieval is needed.

## Validation and support

Current support is limited to Codex. The canonical skill and interface metadata are written in English; user-facing communication follows the user's language. Chinese documentation is maintained separately.

To check the repository's implementation and routing policies:

```sh
npm ci
npm run check
```

These checks require Node.js 22 or newer. Passing them establishes the tested behavior, not superior agent quality or reduced token usage. Behavioral evaluation methods and limitations are documented in [Evaluation](docs/evaluation.md). Local logs, private configurations and generated installations are excluded from published source.

## Contributing and license

See [Contributing](CONTRIBUTING.md) for development and reporting requirements. Report reproducible problems through [GitHub Issues](https://github.com/sky-k111/adaptive-skill-router/issues).

Licensed under [MIT](LICENSE). Copyright © 2026 Ethan Chen.
