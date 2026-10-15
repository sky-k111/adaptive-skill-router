# Install and use across projects

[中文](setup.zh-CN.md) · [Project overview](../README.md)

This guide installs the standalone skill and adds an optional user-level working agreement. It does not require the repository CLI, change other skills, or create a global scheduler. You need Codex with local skill support and your own installed skills; this package does not bundle a specialist library.

## 1. Install the standalone skill

In Codex, send:

```text
Install the standalone skill from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow.
```

Keep the entire directory, including references, scripts and invocation metadata. The built-in installer normally uses `$CODEX_HOME/skills/adaptive-workflow` (`~/.codex/skills/adaptive-workflow` when unset); copying the complete directory to `~/.agents/skills/adaptive-workflow` is another supported local installation route. Use one location and avoid duplicate copies with the same name. If a copy already exists, inspect it and back it up before updating; do not overwrite personal edits silently.

The standalone guidance needs no Node.js runtime or npm install. Optional helpers have separate runtime prerequisites. If you need a reproducible recording, record the source commit you installed rather than assuming that `main` will remain unchanged.

## 2. Add the cross-project agreement

Codex's global instruction directory is `$CODEX_HOME`, defaulting to `~/.codex`. On Windows this is usually the `.codex` folder in your user profile; on macOS/Linux it is normally under your home directory. A custom `CODEX_HOME` selects a different profile.

Inspect `AGENTS.override.md` and `AGENTS.md` there. A non-empty `AGENTS.override.md` takes precedence at the global level; otherwise use `AGENTS.md`. Back up the active file, then merge the following block once. Create `AGENTS.md` if neither supplies guidance. Preserve unrelated instructions; do not replace the whole file or delete an override to force this configuration.

```markdown
## Installed skill selection

When a task needs selection or coordination of installed skills, read the available `adaptive-workflow` skill at the path in the current skill catalog and apply its guidance without waiting for the user to name it. If the project explicitly uses the equivalent `adaptive-skill-router` entry, use that entry instead; do not load both for the same decision. If neither is available, explain the limitation without claiming to have used it.

Use the current catalog first. Read relevant candidate instructions before adoption, respect invocation restrictions, explicit user choices and project constraints, and reuse completed work. In the first substantive response, or the first selection update after focused exploration, briefly explain in the user's language which skills you intend to use, what each contributes and why. Mark unverified choices as candidates; distinguish planned use from actual use.

Clear tasks can proceed directly without a routing announcement. Reuse guidance already read while it remains current, and end extra workflow when its contribution is complete without skipping required checks. Selection grants no extra permissions and does not initiate external search or installation.
```

The same block is available in [global-guidance.md](../examples/global-guidance.md). It uses the skill's catalog path rather than another user's absolute installation path, and asks for replies in your language. It contains no personal configuration or credentials.

Repository and nested instructions can override global defaults. Respect those constraints instead of bypassing them. The combined instruction size is bounded; keep the agreement concise if your profile already contains substantial guidance. See the official [instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [skill invocation](https://learn.chatgpt.com/docs/build-skills) documentation.

## 3. Start a new conversation and check the first response

Start a fresh conversation in your project. If the installed skill is absent from the available list, restart Codex and check the installation location and active profile before proceeding.

Describe a real task without naming the manager or requesting a particular selection, for example:

```text
Our existing CLI sometimes reports a locally present capability as runtime-available even when the runtime did not list it. Preserve the current interfaces and invocation restrictions. First explain how you would approach this; do not inspect the project or implement anything yet.
```

For a task with an actual selection need, look for a task-specific explanation of a suitable installed skill, its contribution and prerequisites still to confirm. There is no required number or fixed list of skills. A first-response plan is not proof that a skill was subsequently used or that the task was completed. A clear small edit may reasonably need no extra skill or announcement.

## 4. Verify actual use during a task

When ready, authorize work on the project. Check that claimed skill reads occurred, chosen methods contributed to the task, valid work was reused and final checks cover the requested behavior. Record failures and limits as well as successes. A useful record connects the request, initial selection, actual work and verification; no baseline comparison is required.

## Troubleshooting and removal

- Missing from the catalog: verify the active `CODEX_HOME`, complete directory structure, enablement and fresh-session discovery. Disk presence alone is insufficient.
- Instructions are listed but a read is denied: check the tool sandbox's access to the skill directory, especially with a custom profile on Windows. Use a permitted installation location or a narrowly scoped resource-access configuration. Do not grant the whole profile directory merely to read skills; it may contain authentication data. A denied read must be reported as unavailable, not successful adoption.
- No selection explanation: check whether the active global file contains the agreement, a higher-priority project instruction changes it, or the task actually requires skill selection. Do not force a skill into a clear task just to produce a banner.
- A selected skill is unavailable: report that prerequisite and use an available approach; do not silently install a replacement.
- To remove this behavior, delete only the added agreement from the active global file. Remove the installed skill separately if desired. Preserve later user edits rather than restoring an old backup wholesale.

This agreement guides Codex's behavior; it is not a guarantee of perfect routing, execution permissions or identical results across libraries and versions.
