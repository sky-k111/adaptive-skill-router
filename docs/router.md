# Optional project router

The standalone workflow does not require this tool. Use the CLI when a reliable session catalog is insufficient and local discovery or structured candidate retrieval would help resolve a real method gap. It retrieves candidates; the host makes the semantic choice and controls execution.

## Build and integrate

Requires Node.js 22 or newer. The CLI is distributed as source; no npm release is assumed.

```sh
git clone https://github.com/sky-k111/adaptive-skill-router.git
cd adaptive-skill-router
npm ci
npm run build
node dist/cli.js init --cwd /path/to/project
node dist/cli.js init --cwd /path/to/project --write
```

The first `init` previews changes. `--write` preserves existing instructions, appends a managed `AGENTS.md` section and creates project guidance under `.agents/skills/adaptive-skill-router/`, including a conditional routing reference. Changed existing files are backed up under the target project's `.adaptive-skill-router/backups/`.

Run from this checkout or use an absolute CLI path. Generated guidance binds that CLI location and the intended project root; reintegrate after moving the checkout. Use a new project session to discover the integration. No global configuration or hook is installed. Do not load equivalent standalone and project guidance merely to repeat the same method selection.

## Commands

| Command | Purpose |
| --- | --- |
| `scan` | Inventory bounded disk roots, metadata, identities and invocation restrictions |
| `scan --native` | Read the catalog of a fresh local Codex app-server process |
| `discover "capability keywords"` | Search local metadata, retaining exact identities and invocation constraints |
| `discover "capability keywords" --online` | Also retrieve unverified GitHub-source candidates from skills.sh |
| `route --task-file task.txt --evidence evidence.json` | Suggest a next approach and relevant capability candidates |
| `inspect <id>` | Read a discovered candidate and check its source fingerprint |
| `init` / `init --write` | Preview / apply project-local integration |

```sh
node dist/cli.js scan --cwd /path/to/project --json
node dist/cli.js scan --root /path/to/library --json
node dist/cli.js scan --native --codex-bin /trusted/path/to/codex --json
node dist/cli.js discover "browser interaction testing" --cwd /path/to/project --json
node dist/cli.js discover "browser interaction testing" --online --owner example --cwd /path/to/project --json
node dist/cli.js route --task-file task.txt --evidence evidence.json --cwd /path/to/project --json
node dist/cli.js inspect <exact-id> --json
```

Native and custom-root discovery cannot be combined. Native failures are reported rather than replaced silently with disk results. A route never invokes a skill, starts a model or agent, installs a dependency, or authorizes an external action.

## Local and external capability discovery

`discover` is an inventory query, separate from evidence-based method routing. It returns local name/description matches even when heuristic method classification would not shortlist them. Candidate, explicit-only, unverified-plugin and disabled states remain distinct, with eligible candidates first. A `candidate` still requires source inspection and actual host availability. English token and Chinese bigram matching is lexical; the host may need an equivalent query in the description's language.

Without `--online`, discovery makes no registry request. With `--online`, only the explicit capability query (2–160 characters), optional GitHub owner and result limit (1–20, default 5) are sent to skills.sh. Do not pass private task contents as the query. The request reads no project files, forwards no credentials and makes no automatic retry. The default timeout is eight seconds, the response limit is 512 KiB, and redirects are restricted to the registry's HTTPS origins. No repository is cloned and no package manager is started.

Remote metadata has separate identities of the form `skills.sh:owner/repository/skill`, source and registry links, reported installs and `remote-unverified` availability. Currently only GitHub repository sources are accepted. Duplicate names across different sources remain separate. Matching local names do not establish remote installation provenance. Malformed, duplicate or out-of-owner records are excluded with a count diagnostic. Missing or invalid install counts become `null`, never quality scores.

Output keeps `local`, `remote`, catalog diagnostics and an empty `selectedSkills` separate. A remote HTTP/network/timeout/schema failure leaves local results available with `remote.status: "failed"` and exit code 2. A successful empty search has `remote.status: "ok"`; omitted networking has `"not-requested"`, both exit 0. Invalid requests and local discovery failures exit 1. JSON partial results remain on stdout; callers must inspect status as well as the process exit code.

The adapter uses the public search endpoint used by the registry's [own CLI](https://github.com/vercel-labs/skills/blob/main/src/find.ts), rather than the separately authenticated versioned API. This external contract may change; do not silently reinterpret schema drift as no matches. Deterministic tests use controlled HTTP responses and do not establish live service availability.

Review the exact source `SKILL.md`, relevant dependencies, license, host compatibility and workflow obligations before selection. Installation requires applicable user authorization; retrieval never grants it. [Capability selection](../skills/adaptive-workflow/references/capability-selection.md) describes how the host can adopt available skills and report remote installation needs. The standalone helper in that skill supports the same remote search without building this CLI.

## Discovery boundaries

Default disk roots include user `~/.agents/skills`, `$CODEX_HOME/skills` and repository `.agents/skills` / `.codex/skills` from the working directory to its nearest Git root. `.codex` roots are compatibility locations; host visibility depends on the installed version. Unix also includes `/etc/codex/skills`.

Without a Git root, project discovery includes only the specified working directory and emits a scope diagnostic. From a child directory, use the intended root as `--cwd` or explicitly add `--root`. Custom roots change this tool's inventory, not the host's registered catalog.

Disk presence and a fresh native process do not establish the catalog of an existing desktop session. Disabled capabilities and unverified caches are ineligible. Explicit-only entries are excluded from automatic candidates and may be requested with `--skill <exact-id>` where enabled. Duplicate names retain separate identities. Invalid restriction files do not silently become permissive.

## Task-bound evidence

Required fields are `task` (string), `explored` (boolean), `findings` and `unknowns` (arrays of nonempty strings), `scope` and `risk` (strings). `scope` accepts `local`, `cross-module` or `unknown`; `risk` accepts `low`, `medium`, `high` or `unknown`.

The evidence task must match the task text; task-file trailing whitespace is removed. Explored evidence must contain a finding. Optional boolean fields include `rootCauseKnown`, `requirementsClear`, `verificationReady`, `regressionRisk`, `stalled`, `production`, `destructive`, `needsDomainKnowledge` and `coordinationNeeded`. Set coordination only for an observed coordination need, not because an edit spans files.

See [local-change evidence](../examples/local-fix.evidence.json), [unresolved-cause evidence](../examples/unknown-bug.evidence.json) and the [routing reference](../skills/adaptive-skill-router/references/routing.md).

The CLI validates structure and task binding, not whether observations are true or current. Refresh affected findings after code, requirements or results change. Retrieval scores are metadata signals, not quality scores. Classifying an unknown does not automatically require interrupting the user.

## Verification and limitations

Run `npm run check` for implementation and policy validation. Behavioral evaluation tools and their limits are described in [Evaluation](evaluation.md); discovery and integration internals are described in [Architecture](architecture.md).

Keep generated installations, backups, private evidence and evaluation outputs outside distributed source. Test roots can be selected with `ASR_TEST_ROOT` or ignored `.adaptive-skill-router/local-settings.json`; otherwise tests use the system temporary directory.

Current support is limited to Codex. Candidate retrieval uses English token and Chinese bigram heuristics; semantic relevance, prerequisite checks, instruction conflicts and authorization remain host responsibilities.
