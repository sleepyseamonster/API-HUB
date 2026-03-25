# Frontend Instructions

This file applies to work under `frontend/`.

## Product and design
- Follow `docs/design/DESIGN_SYSTEM.md`. The UI should feel like a precise developer tool, not generic SaaS.
- Preserve the current product framing in `docs/vision/WHAT_THIS_IS.md`.
- Keep the visual language restrained: sharp geometry, clear status states, minimal decoration, and no unnecessary UI.

## Architecture
- Treat `frontend/shared/contracts/portal-data-provider.ts` as the provider boundary for UI behavior.
- Treat `frontend/entities/endpoints/model/endpoint-registry.ts` as the current code-level truth for the endpoint catalog.
- Keep changes aligned with `docs/specs/API_SOURCE_OF_TRUTH.md`. If runtime assumptions change, update the affected docs in the same change.
- When moving any path from mock or preview behavior toward live behavior, keep the boundary stable unless there is a documented reason to change it.

## Frontend guardrails
- Keep components modular and reusable.
- Default to existing project patterns before inventing new abstractions.
- Do not add new UI libraries unless the need is real and justified. Prefer Tailwind, existing primitives, and inline SVGs.
- If an interface element does not improve clarity or function, remove it.

## Validation
- Use the commands documented in `frontend/README.md`.
- After code changes, run `npm run lint` and `npm run typecheck` in `frontend/`.
- Run `npm run test` for logic or component changes.
- Run `npm run test:e2e` when a user-facing flow or route behavior changed materially.
