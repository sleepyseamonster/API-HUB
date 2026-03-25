# API HUB Instructions

This file is the canonical Codex-native instruction baseline for this repository.

## Authority and precedence
- `docs/governance/OPERATING_MODEL.md` defines decision authority, Tier 1-3 boundaries, and protected zones.
- `docs/specs/API_SOURCE_OF_TRUTH.md` defines what is implemented now and where canonical runtime assumptions live.
- This file defines repo-wide execution rules.
- The nearest subdirectory `AGENTS.md` adds scoped rules for that surface area.
- `Research/` is advisory context only. Nothing in `Research/` is binding until it is translated into canonical docs, config, or code.

## Canonical documents
- Read `docs/governance/OPERATING_MODEL.md` before making governance-sensitive decisions.
- Read `docs/governance/DECISION_LOG.md` when checking durable architecture decisions or recording a new one.
- Read `docs/vision/WHAT_THIS_IS.md` when a task affects product identity, audience, or positioning.
- Read the relevant files in `docs/specs/` when a task touches contracts, architecture, security, errors, workflows, or observability.
- Treat `README.md` and `ROADMAP.md` as orientation and sequencing aids, not as the authority for current runtime behavior.

## Default working model
- The assistant is the default technical operator for implementation details, sequencing, refactors, and documentation maintenance within the authority delegated by `docs/governance/OPERATING_MODEL.md`.
- Surface Tier 2 decisions clearly in the response.
- Stop and ask before crossing a Tier 3 boundary.
- Use subagents selectively for explicit parallelizable work. Do not delegate by default.
- Load a skill from `.agent/skills/` only when the task clearly matches that skill.

## Task bootstrap
- Read the nearest `AGENTS.md` plus only the docs needed for the task at hand.
- Do not ingest the entire `docs/` tree by default.
- When editing a contract or behavior, read the relevant source-of-truth doc before changing code.
- When ambiguity materially affects implementation, update `docs/governance/DECISION_LOG.md` or surface the open decision clearly.

## Guardrails
- No new system surface area without a documented contract.
- No public-facing endpoint without a corresponding entry in the endpoint registry and API specification.
- Keep mock, preview, and live behavior clearly separated. Never present simulated behavior as production-ready.
- Keep dependencies tight. Prefer built-in platform capabilities and justify any new package.
- Do not search, index, or modify `Kirk's Folder/` unless explicitly requested.
- Keep external research targeted and high-value. Prefer primary sources. Research informs decisions but does not override repo truth.

## Validation
- Run the relevant checks for the surface you touched.
- For frontend work, run `npm run lint`, `npm run typecheck`, and the relevant test commands from `frontend/` unless the change is purely documentation.
- For backend or tooling work, run the relevant validation available in the repo and state clearly if the toolchain is missing.
- For docs work, verify that canonical docs remain aligned with implementation and with each other.
