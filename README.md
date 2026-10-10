# Adaptive Skill Router

**Explore first. Use a Skill only when the task benefits.**

Adaptive Skill Router is a local, Codex-first prototype for discovering installed Skills and helping Codex choose a proportionate development method. Clear local fixes stay direct. Unresolved causes, missing coverage, dependent interfaces, or high consequences can justify specialized methods.

The CLI discovers capabilities and ranks metadata candidates. **Codex makes the final semantic choice**, including choosing no Skill. A retrieval score is not a quality score, a permission grant, or evidence of reduced token usage.

The workflow should also be understandable in conversation: connect inspected findings to the chosen method and next verification, explain adjustments and retained work when evidence changes, and tie delivery to actual changes and checks. These are ordinary progress messages, not a separate popup or mandatory workflow for every conversation.

[中文说明](README.zh-CN.md) · [Architecture](docs/architecture.md) · [Evaluation](docs/evaluation.md)

## Install the standalone Skill

For the conversational development workflow, install [adaptive-workflow](skills/adaptive-workflow/SKILL.md). It is instruction-only and does not require Node.js or the routing CLI. In Codex, ask:

```text
$skill-installer Install adaptive-workflow from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow
```

Then request `$adaptive-workflow` on a development task, or let Codex consider it when exploration leaves a method gap. If the installed Skill does not appear, restart Codex. Installation makes it available; it does not force a complete workflow on every message. See [OpenAI's Skills documentation](https://learn.chatgpt.com/docs/build-skills).

| Entry | Use |
| --- | --- |
| `skills/adaptive-workflow` | Standalone Chinese workflow: evidence-based method choice, useful progress explanations, adaptation and verification |
| `skills/adaptive-skill-router` | Project guidance with optional CLI discovery and routing references |

The entries share principles. Usually choose the standalone Skill or project integration; reading both on every task is unnecessary. Neither installs Superpowers or Spec Kit, rewrites global instructions, or grants permission for external actions.

## Optional project router

Requires Node.js 22 or newer. Source is available on [GitHub](https://github.com/sky-k111/adaptive-skill-router); there is no npm release.

```sh
git clone https://github.com/sky-k111/adaptive-skill-router.git
cd adaptive-skill-router
npm ci
npm run build
node dist/cli.js scan --cwd /path/to/your/project --json
node dist/cli.js init --cwd /path/to/your/project
node dist/cli.js init --cwd /path/to/your/project --write
```

On Windows, use an absolute project path such as `D:/projects/my-app`. Run these commands from this repository, or replace `dist/cli.js` with its absolute path. The first `init` previews changes. `--write` preserves existing instructions, appends a managed `AGENTS.md` block, and creates `.agents/skills/adaptive-skill-router/SKILL.md` with a conditional routing reference. Changed existing files are backed up in the target project's `.adaptive-skill-router/backups/`. Add that backup directory to the target project's ignore rules if appropriate.

Start a fresh Codex session in the target project so it discovers the integration. The generated Skill reuses the distributed guidance and binds to the current CLI location and project root; a reliable host catalog needs no repeat scan. Rerun `init` after moving or uninstalling this checkout. No global configuration or hooks are changed. Review the preview before applying it to a repository.

For a globally available local command, optionally run `npm link` after building; this explicitly changes your npm command installation. The commands below then work as `asr ...`.

## What it does

| Command | Purpose |
| --- | --- |
| `scan` | Read a bounded disk inventory; descriptions, identities, invocation restrictions and diagnostics |
| `scan --native` | Ask a fresh Codex app-server process for its `skills/list` catalog |
| `route --task-file task.txt --evidence evidence.json` | Suggest direct execution, more exploration, clarification, or relevant method candidates |
| `inspect <id>` | Read a discovered Skill on demand, checking that its source has not changed |
| `init` / `init --write` | Preview / install project-local integration |

No route command launches a Skill, model turn, subagent, shell command from a Skill, or a production action. The host reads a useful candidate and evaluates prerequisites, downstream calls, cost, project constraints and authorization. Broad workflow triggers and possible chained Skills appear as advisories, not automatic orders.

## What you see in conversation

For example, a cache investigation might explain: "The existing test covers repeated reads for one tenant, but the cache key omits tenant identity. I'll check cross-tenant results and load counts, then repair that boundary." If the cause remains unproven, the host can explain why it adopts `systematic-debugging` and which parts it uses.

A changed requirement should produce an explanation of affected behavior and reusable work. Delivery should connect the actual change to completed verification. A clear spelling fix can simply reuse its existing test and finish. These are examples of useful communication, not fixed scripts or mandatory stages; announcing that a Skill is active is insufficient on its own.

## Discovery and installation paths

Default disk roots include user `~/.agents/skills`, `$CODEX_HOME/skills` (normally `~/.codex/skills`), and project `.agents/skills` / `.codex/skills` from the working directory to its nearest Git root. Without a Git root, only the working directory is used for project roots and a scope diagnostic is emitted. From a child directory, set `--cwd` to the intended project root or explicitly add `--root` as needed. Unix also includes `/etc/codex/skills`. `.codex` roots are included for compatibility with existing installations; their visibility depends on the Codex version.

```sh
node dist/cli.js scan --root /another/skill-library --json
node dist/cli.js scan --no-defaults --root ./fixtures/skills --json
node dist/cli.js scan --native --codex-bin /trusted/path/to/codex --json
```

Custom `--root` changes this tool's inventory; it does **not** register those Skills with Codex. Source can live in any repository. Codex discovery needs a supported root, a supported symlink/junction, or a runtime extra-root configuration. `SKILL.md` is the recognized manifest filename and needs YAML `name` and `description`; supporting resources may live alongside it.

Disk discovery is not proof of active session availability. Plugin caches are scanned only with `--include-plugin-cache` and remain unverified, so they are not routed. Native discovery uses an installed, trusted Codex executable and no model turn. It reflects a fresh CLI process, which can differ from a desktop session's plugin state, managed settings or runtime policy. Native discovery failures are reported rather than silently replaced with disk results. Native mode cannot be combined with custom disk roots.

Explicit-only Skills (`policy.allow_implicit_invocation: false` in `agents/openai.yaml`) are excluded from automatic candidates. `route --skill <exact-id>` can request them explicitly. Disabled Skills and unverified cached Skills remain ineligible. Duplicate names are preserved; use exact IDs. A malformed restrictions file stops automatic candidates for affected discovery rather than assuming permission.

## Evidence before workflow

Clear fixes can be completed without running the router or writing an evidence file. Use routing when method selection remains uncertain after a bounded investigation:

```json
{
  "task": "Fix intermittent cache results",
  "explored": true,
  "findings": ["Different request identities produced the same cached response."],
  "unknowns": ["The first incorrect state boundary is not yet proven."],
  "scope": "local",
  "risk": "medium",
  "rootCauseKnown": false,
  "requirementsClear": true,
  "verificationReady": false
}
```

`task` must match the task text exactly. `--task-file` removes trailing whitespace, so use that same normalized text in evidence. `scope` is `local`, `cross-module`, or `unknown`; `risk` is `low`, `medium`, `high`, or `unknown`. Other optional booleans are `regressionRisk`, `stalled`, `destructive`, `production`, `needsDomainKnowledge`, and `coordinationNeeded`. Cross-module scope alone does not justify planning; record `coordinationNeeded: true` only for observed coordination needs.

The CLI validates evidence structure, not whether the observations are true. Reusing fabricated or stale findings defeats the design. A `clarify` result asks the host to identify whether the unknown requires further investigation or a user decision; it does not mandate interrupting the user. Production or destructive flags request an authorization boundary check; they do not invent an approval requirement where authorization already exists.

## Principles

1. Start with the agent's reasoning; availability alone does not justify invoking a Skill.
2. Choose Skills for concrete expected improvements, including downstream cost.
3. Handle clear local tasks directly without mandatory documents, plans or subagents.
4. Inspect code, errors and existing checks before choosing a method; check high-risk boundaries early.
5. Borrow relevant methods without importing unrelated ceremony; disclose partial use.
6. Resolve conflicts through user goals and project constraints; reuse evidence and completed work.
7. Verify every change proportionately and disclose unrun checks.
8. Explore better solutions within the authorized delivery scope.
9. Preserve necessary approvals for consequential operations without repeatedly confirming ordinary local work.
10. Judge results, correctness, rework, time and cost, rather than completed workflow steps.

## Validate and contribute

```sh
npm run check
npm pack --dry-run
node scripts/create-behavior-workspace.mjs /new/sandbox/path
```

Automated cases cover policy, parsing, invocation restrictions, collisions, symlink loops, source changes and safe integration. The behavioral workspace provides three real coding tasks for a separate Codex session; it never replaces an existing directory. See [evaluation limits](docs/evaluation.md) before interpreting a passing result as an improvement in agent quality.

To choose where unit-test sandboxes live, set `ASR_TEST_ROOT` or put `{"testRoot":"/absolute/test/path"}` in ignored `.adaptive-skill-router/local-settings.json`. Without either, tests use the system temporary directory. Test definitions remain in this repository; behavioral workspaces and their reports belong in a separate test area. `scripts/verify-behavior-workspace.mjs <completed-workspace>` independently checks the three cases' acceptance contracts.

This release supports **Codex only**. No Superpowers or Spec Kit is installed or bundled. Their Skills may be discovered if separately installed and exposed to Codex; the tool does not parse an entire framework's command system or guarantee compatibility. Metadata retrieval currently uses small English token / Chinese bigram and method heuristics; semantic judgment remains with Codex. Future host adapters and measured comparisons should follow evidence, not feature-count targets.

See [contributing](CONTRIBUTING.md). MIT © 2026 Ethan Chen.
