# Adaptive Workflow

**Choose and coordinate the Codex skills you already have installed.**

[中文说明](README.zh-CN.md) · [Skill instructions](skills/adaptive-workflow/SKILL.md) · [Optional CLI](docs/router.md) · [Engineering checks](docs/evaluation.md)

Adaptive Workflow helps Codex decide whether an installed skill is useful for the current task, which candidate fits, and how to coordinate skills with overlapping workflows. Clear tasks can proceed directly. The goal is appropriate use of the existing library, with understandable decisions and no unnecessary process.

The standalone skill works with the host's catalog and tools. It requires no additional framework, online service or command-line package. The names `adaptive-workflow` and `adaptive-skill-router` remain unchanged for compatibility; the latter is the equivalent project integration entry. Use one entry for a decision rather than loading both.

## What it does

| Capability | Expected behavior |
| --- | --- |
| Decide whether a skill helps | Identify a concrete contribution; choose no additional skill when existing reasoning and tools suffice |
| Choose an installed candidate | Use descriptions to shortlist, then check actual instructions, prerequisites and required downstream work |
| Coordinate overlapping workflows | Give each necessary skill a distinct contribution, resolve conflicts under user/project constraints and reuse completed work |
| Reassess and stop | Change the selection when needs or prerequisites change, and end extra workflow when its contribution is complete |

A material choice should explain the task need, the selected skill and what it contributes. An important rejection or missing prerequisite should be explained when it affects the next action. Inventories, repeated banners and selection reports are not required for ordinary work.

## Install

Ask Codex:

```text
Install the standalone skill from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow.
```

Alternatively, copy the entire `skills/adaptive-workflow` directory into a supported skill directory, such as `~/.agents/skills/adaptive-workflow`. Preserve its structure. Use a fresh session if the installed or updated entry is not reflected in the catalog. See [Codex skill documentation](https://developers.openai.com/codex/skills/) for host discovery details.

The standalone guidance needs no Node.js runtime. Optional repository tools and bundled scripts require Node.js 22 or newer; explicit proxy configuration needs Node.js 24.14+.

For cross-project use without naming the manager each time, follow [Install and use across projects](docs/setup.md). Installing the skill alone and adding a global working agreement are separate steps.

## Use

State the task and constraints, for example:

```text
Use $adaptive-workflow to fix this intermittent failure using suitable installed skills. Preserve the existing test framework and avoid duplicate planning or review.
```

Or ask about the library itself:

```text
Use $adaptive-workflow to explain which of my installed skills fit this task, where their workflows overlap, and whether any additional skill is actually needed.
```

The host may also consider the skill from its description. Installation does not guarantee activation on every message, and the skill does not intercept all conversations or control Codex's scheduler. Explicit user skill choices and applicable instruction/permission constraints remain authoritative.

For an intermittent defect, a useful decision might select an available investigation skill to establish the cause while deferring an unrelated planning workflow. A bounded text edit might need no additional skill. These illustrate intended judgment, not results of an executed task.

## Optional local tools

When the current session catalog is insufficient, the repository CLI can inventory local skills, search metadata and inspect a candidate's instructions. It retrieves candidates; Codex makes the semantic choice.

```sh
npm ci
npm run build
node dist/cli.js discover "capability keywords" --cwd /path/to/project --json
node dist/cli.js inspect <exact-id> --expect <inspectionFingerprint> --cwd /path/to/project --json
```

Project-local integration is optional. Preview it with `node dist/cli.js init --cwd /path/to/project`; `--write` applies it with conflict checks and backups. See the [CLI reference](docs/router.md) for commands and boundaries.

Disk discovery is not proof of availability in the current conversation. Native discovery describes a fresh CLI process. Disabled, explicit-only and unverified-cache states remain distinct; matching names do not establish identical sources. Inspection tokens detect changes to entry instructions, invocation metadata and resolved paths, not all supporting files or runtime permissions.

## Scope and retained utilities

External search, pinned source collection and selected-file fingerprints remain available as optional utilities. External discovery is for an explicit request to find or assess additional skills; a local mismatch does not automatically start a search or installation. These utilities are outside the default installed-skill selection path. See [source collection](docs/source-review.md) and the [CLI reference](docs/router.md) when that separate work is requested.

This project does not provide a global scheduler, automatic dependency setup or permission bypass. Descriptions and scores cannot authorize execution. Required project checks and unfinished user requirements still apply when an extra workflow ends.

## Engineering quality and evidence

Development prioritizes correctness, compatibility and usability of shipped capabilities. Feature expansion and further default-Codex comparisons are paused.

This is an early preview. The [installation-to-completion walkthrough](docs/usage-walkthrough-2026-10-15.md) records public installation, the portable global agreement, actual skill reads and an accepted source repair, including failed environment attempts and verification limits.

Run `npm run check` for implementation tests and deterministic routing regressions. These checks do not establish better model reasoning or token savings. [Engineering validation and historical evidence](docs/evaluation.md) retains prior results, including comparisons that did not establish a reliable advantage. Private configuration, raw task evidence and generated integrations are not distributed.

## Contributing and license

See [Contributing](CONTRIBUTING.md). Report reproducible problems through [GitHub Issues](https://github.com/sky-k111/adaptive-skill-router/issues).

Released under the [MIT License](LICENSE). Copyright © 2026 Ethan Chen.
