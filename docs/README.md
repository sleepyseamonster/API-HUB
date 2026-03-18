# Documentation Map

This folder is the planning and operating handbook for API HUB.

## Start Here
- `specs/API_SOURCE_OF_TRUTH.md`: The canonical map of what is real in the repo today.
- `specs/API_SPECIFICATION.md`: Human-readable endpoint contracts for V1.
- `specs/ARCHITECTURE.md`: Target runtime architecture (frontend, gateway, DB, n8n, storage).
- `specs/PRODUCT_SPEC.md`: Product behavior and UX requirements.
- `vision/WHAT_THIS_IS.md`: Business framing and value proposition.
- `vision/BRAINSTORMING.md`: Raw ideas and exploration notes.

## Current Implementation Snapshot
As of March 16, 2026:
- Frontend developer portal exists and is functional with typed mock data.
- Backend gateway, database schema, and n8n workflow artifacts are not implemented in this repo yet.

## Documentation Rules
- If endpoint definitions change, update `frontend/entities/endpoints/model/endpoint-registry.ts` first.
- Then sync `specs/API_SPECIFICATION.md` in the same pull request.
- If system behavior changes, update `specs/API_SOURCE_OF_TRUTH.md` so planning docs stay accurate.
