# Reproducible source collection

Source collection supplies material for the host's assessment. It does not make a semantic selection, interpret license terms, authorize installation or execute fetched content.

## Commands

The standalone skill needs no package installation:

```text
node <skill-directory>/scripts/collect-source.mjs --source <owner/repository> --skill <directory-slug>
node <skill-directory>/scripts/collect-source.mjs --source <owner/repository> --path <exact/SKILL.md> --ref <commit> --include <supporting/path>
```

The optional repository CLI offers the same collector with project-local proxy configuration:

```text
asr source <owner/repository> --path <exact/SKILL.md> --ref <commit> --json
```

Use an exact path when directory slugs are missing or ambiguous. Supporting paths passed with repeatable `--include` are repository-relative, not relative to the skill directory. Both entry points accept the existing trusted `--proxy` / `ASR_HTTPS_PROXY` setting; explicit proxy setup requires Node.js 24.14+. The standalone helper's `--timeout-ms` sets a 100–60,000 ms total deadline, default 30,000 ms. Source collection is an explicit network operation; local discovery remains offline by default.

## What is bound and collected

The collector resolves a branch/ref once to a full commit, obtains that commit's recursive tree, then reads blobs by their tree identities. Files include their exact commit URL, Git blob ID, SHA-256 and UTF-8 content. A returned blob must match both its size and Git hash. Requests use the public GitHub API with version `2026-03-10`; no token, project contents or credential store is read. See GitHub's [commit](https://docs.github.com/en/rest/commits/commits#get-a-commit), [tree](https://docs.github.com/en/rest/git/trees#get-a-tree) and [blob](https://docs.github.com/en/rest/git/blobs#get-a-blob) contracts.

Collected material includes the entry, optional `agents/openai.yaml`, ancestor license/notice files, explicit supporting paths and bounded local references in Markdown links, reference definitions or literal `references/`, `scripts/` and `assets/` paths. Scripts remain text. External URLs and natural-language obligations are not followed automatically. Invocation metadata is supplied for host inspection; declared dependencies are not treated as installed tools.

The current limits are 16 files, 128 KiB per file, 1 MiB of collected text, two reference levels, 128 queued references, a 4 MiB tree response and 20,000 tree entries. Truncated trees fail. Symlinks, submodules, binary text, oversized or missing files and out-of-repository references remain unresolved. One connection failure may be retried within the shared deadline; HTTP errors, redirects and schema/content failures are not retried. Renamed/moved repositories need an explicit canonical source instead of a silently followed redirect.

## Result contract

- Exit **0**, `status: "complete"`: the bounded collection finished without unresolved entries.
- Exit **2**, `status: "incomplete"`: collected material stays on stdout, with per-path failures and limits in `unresolved`.
- Exit **1**: the request, commit or tree could not establish a usable source identity; an actionable error is on stderr.

`reviewStatus` is always `not-reviewed`, and `selectedSkills` stays empty. Completion does not prove that every semantic dependency has been found, licenses permit the intended use, a publisher is trusted, Codex exposes the skill, or the workflow fits. Missing license material is explicit; a collected license still requires human/host interpretation. Git hashes check consistency with the provider's pinned tree, not publisher authenticity. The host must connect the actual contribution, prerequisites and workflow scope to the task before choosing.

Raw bundles can contain third-party copyrighted instructions. Keep them local unless redistribution is appropriate; they are not included in this project's package. Automated tests use authored fixtures and controlled HTTP responses. [Evaluation](evaluation.md) separates these checks from actual network validation and comparative task evidence.
