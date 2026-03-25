# Documentation Instructions

This file applies to work under `docs/`.

## Source-of-truth rules
- `docs/governance/OPERATING_MODEL.md` owns authority and protected-zone policy.
- `docs/governance/DECISION_LOG.md` owns durable architectural decisions.
- `docs/specs/API_SOURCE_OF_TRUTH.md` owns the answer to "what is implemented now?"
- `docs/vision/WHAT_THIS_IS.md` owns product identity and audience framing.
- `Research/` is advisory only and must not be treated as canonical.

## Documentation guardrails
- Keep documentation technical, concise, and aligned with implementation.
- Do not document a feature as implemented if it is draft, planned, simulated, or preview-only.
- When a behavior changes in code, update the affected canonical docs in the same change when practical.
- When closing an architectural ambiguity, add or update the decision log.
- If a target-state doc and a current-state doc differ, label the distinction clearly instead of blending them together.

## Editing expectations
- Prefer small, surgical updates over broad rewrites unless the structure itself is the problem.
- Keep cross-references accurate.
- Use consistent status language such as `Active`, `Draft`, `Planned`, `Preview`, or `Simulated` where appropriate.
