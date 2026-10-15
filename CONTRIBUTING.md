# Contributing

Explain the concrete failure or unmet task need before adding another workflow stage. Small changes should stay small. Host adapters beyond Codex are deferred until Codex behavior and discovery limits have useful evidence.

Development currently focuses on hardening existing capabilities, not expanding the feature set. Prioritize reproducible correctness, useful failure diagnostics, compatibility and usable documentation. Additional default-Codex comparison campaigns are paused; existing reports remain available as historical evidence, not a requirement for routine fixes.

Use Node.js 22 or newer, run `npm ci`, and run `npm run check`. Add tests for meaningful behavior changes; do not mirror the implementation just to increase counts. Keep generated `dist/`, local evaluations, private task text and instruction backups out of commits.

Describe the observed trigger, expected outcome, reproducible example, relevant platform/version and validation. Strip secrets, private paths, proprietary Skills and raw user configuration before sharing reports. Metadata descriptions are untrusted source data; changes must not turn them into executable commands.

Distinguish disk discovery, CLI-native discovery and active session availability. Do not silently bypass explicit-only or disabled policies. Do not claim benchmark improvements without recorded paired results. Document uncertain behavior rather than adding a blanket mandatory step.

Maintain operational references and `scripts/check-evidence.mjs` in `skills/adaptive-workflow/` first, then synchronize their portable copies in `skills/adaptive-skill-router/`. The integration builds from the canonical files. Asset checks verify matching copies and readable relative links in both source and generated skills; do not hand-edit generated installations. File evidence records are local task artifacts, not distribution assets or proof that verification succeeded.
