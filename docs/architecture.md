# Architecture and boundaries

The core skill helps the host choose and coordinate already-installed skills for a concrete task. It reuses the session catalog, reads plausible candidates as needed, resolves overlapping workflows and preserves completed work. Clear tasks can proceed directly. This is host guidance, not a global scheduler or an automatic selector.

The CLI supplies optional local inventory and inspection. Remote search, source collection and file-state utilities remain available outside the primary path; an empty local result does not trigger external discovery. No commands have been removed or added as part of this scope correction.

## Components

- `scanner.ts`: bounded discovery, YAML metadata, Codex invocation restrictions, filesystem identities, source fingerprints and diagnostics.
- `native.ts`: a short-lived JSON-RPC app-server client calling only `initialize` and `skills/list`. No model turn. The trusted executable is caller-supplied or the installed `codex` executable.
- `router.ts`: structured evidence validation, method-gap advice, and lightweight bilingual metadata retrieval. `selectedSkills` is always empty: the CLI never claims to make the final semantic selection.
- `integration.ts`: project-local instruction preview and writes, preserving existing text and making backups. Generated guidance reuses the distributed Skill body and routing reference, copies the canonical investigation, capability-selection and continuity references and file-state/search/source-collection helpers, and appends trusted CLI/project bindings. Resource collisions and stale previews stop before mutation. Whole-plan checks include unchanged targets and reject redirected parent directories and changed previews before initial mutation; writes are not a transactional filesystem operation. Concurrent directory replacement remains outside its guarantees.
- `cli.ts`: `scan`, `discover`, `source`, `route`, `inspect`, and `init`; JSON output supports other tools without invoking another model.
- Portable `search-skills.mjs`: shared lexical tokenization, query coverage, explicit constraints and bounded registry requests. It preserves original provider rank and filtered remote identities, without making a semantic selection.
- Portable `collect-source.mjs`: resolves one public GitHub commit, validates tree/blob identities and collects bounded source material. [Source collection](source-review.md) defines limits and incomplete states; successful retrieval never changes `reviewStatus` to reviewed.

There is no cloud index, embedding service, shell hook, API classifier, global instruction rewrite, automatic dependency installation, or persistent agent process.

## Operational methods and continuity evidence

The standalone entry's main reference evaluates installed candidates, prerequisites, overlap and downstream costs. Existing investigation and continuity notes remain conditional fallbacks when uncertain causes or changed evidence obstruct that selection. They are not a general development framework or required stages. External-search instructions have been removed from the selection reference; retained remote tools are documented separately in the CLI and source-collection documentation.

The optional `check-evidence.mjs` helper uses Node built-ins to fingerprint explicitly selected project files. A record binds file names, resolved locations and content hashes to a canonical project root. Capture creates an exclusive local record; checks report unchanged, changed or missing files. The helper validates input, confines resolved paths to the selected root and treats record contents as data. It never executes recorded commands or asserts a test result.

This is continuity support, not a security sandbox, a signed evidence store or an atomic snapshot. Unselected dependencies, environment changes and concurrent file writes remain outside its claims. Keep records local because they contain project paths. The references remain usable through host file tools when Node is unavailable.

## Discovery is layered

Disk mode inventories supported and compatibility roots. Native mode asks a fresh Codex CLI process for its own catalog, then reads metadata at the returned paths. Neither proves the exact skill catalog of an already-running desktop session. Native runtime records currently use custom provenance rather than reconstructing Codex's internal scope hierarchy.

Without a Git root, default disk project discovery remains limited to the requested working directory and emits `project-scope-current-directory`. It does not silently scan ancestor projects. Generated commands bind the intended project root; an explicit extra root can inventory an ancestor library without registering it with Codex. Use an already-reliable host catalog rather than scanning again solely to demonstrate the workflow.

Plugin caches remain unverified in disk mode. Symlink/junction cycles terminate through canonical-directory tracking. Different paths to one manifest deduplicate; equal names at different manifests remain separate. Paths and fingerprints are local identities, not portable IDs between machines.

Manifests are read locally to parse metadata, estimate body length and flag broad triggers or possible downstream calls. Bodies are not included in scan JSON. `inspect` is the on-demand disclosure to the host. The character-based token estimate is approximate and excludes dependencies, downstream calls and any model's tokenizer.

Each local candidate carries an inspection fingerprint over the resolved manifest path, normalized instructions and resolved optional `agents/openai.yaml` contents. Policy parsing uses that same metadata snapshot. On-demand reads re-resolve the selected paths rather than trusting cached canonical paths. `inspect --expect` binds a later scan to an earlier retrieval result; omitted tokens deliberately inspect the latest scan. Legacy catalog entries without this evidence require rescanning. This detects entry/metadata drift, including directory-link redirection with identical instructions; it does not lock files, pin supporting resources, certify provenance or capture runtime permission changes.

## Routing limitations

Evidence is asserted by the host. The CLI validates its shape and exact task binding but cannot prove exploration, truth, impact, or freshness beyond that binding. Repeated tasks can still carry stale evidence unless the host updates its observations.

The current policy considers planning candidates for unresolved requirements or observed coordination needs (`coordinationNeeded: true`). Cross-module scope alone creates no planning gap. Unknown risk/scope usually returns exploration; `stalled` allows considering a systematic investigation. Relevant method hints are recognized in name/description with regular expressions. Common English words are excluded from overlap scores. Domain matching uses task overlap; it may miss synonyms, languages other than English/Chinese, subtle domains, or a Skill with poor metadata.

Broad workflow Skills can appear in a shortlist when their metadata matches an observed gap. Their advisory does not establish value or establish harm. The host must inspect relevant content and the cost of its invocation chain. Blanket suppression would also discard useful methods embedded in overly broad packages.

Invocation permissions are respected, but this tool is not a security boundary. Managed policy, tool access, runtime approvals, sandbox constraints and explicit user instructions belong to Codex. Reading a Skill is not authorization to execute its scripts or follow untrusted instructions. Route output cannot override those boundaries.

## Upstream references

Codex discovery roots, symbolic links, optional `agents/openai.yaml`, and implicit-invocation policy are described in [OpenAI's Skills documentation](https://developers.openai.com/codex/skills/). Runtime `skills/list` and per-working-directory extra roots are documented in [OpenAI's app-server reference](https://developers.openai.com/codex/app-server/). The current CLI does not set runtime extra roots.

External capability integrations require version-specific checks of discovery, prerequisites and execution boundaries before adoption. This project does not establish compatibility with an entire external workflow through metadata retrieval alone.
