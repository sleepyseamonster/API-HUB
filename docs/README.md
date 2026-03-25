# Documentation Map

Status: Active
Owner: API HUB core docs
Last updated: 2026-03-24
Depends on: `README.md`, `ROADMAP.md`, `frontend/entities/endpoints/model/endpoint-registry.ts`
Source of truth: This file defines where canonical project docs live.

This folder is the planning and operating handbook for API HUB.

## Read Order
1. `governance/OPERATING_MODEL.md`
2. `governance/IMPLEMENTATION_PLAN.md`
3. `governance/LEGAL_BOUNDARIES.md`
4. `specs/API_SOURCE_OF_TRUTH.md`
5. `specs/API_SPECIFICATION.md`
6. `specs/N8N_HANDSHAKE_SPEC.md`
7. `specs/ERROR_MODEL.md`
8. `specs/SECURITY_MODEL.md`
9. `specs/OBSERVABILITY_SPEC.md`
10. `specs/LAUNCH_RUNBOOK.md`

## Folder Map
- `governance/`: Authority model, legal boundaries, and durable decision records.
- `specs/`: Runtime contracts, security rules, operational rules, and launch documentation.
- `design/`: Visual system and UX constraints for the portal.
- `vision/`: Product framing, brainstorming, and project-shape documents.

## Canonical Documents
- `governance/IMPLEMENTATION_PLAN.md`: Current build sequence and architecture decisions for implementation.
- `specs/API_SOURCE_OF_TRUTH.md`: What is implemented in the repo today.
- `specs/API_SPECIFICATION.md`: Public endpoint contract for the current catalog.
- `specs/LOCAL_BUSINESS_SEARCH_QUICKREF.md`: One-page operator cheat sheet for the live demo route.
- `specs/N8N_HANDSHAKE_SPEC.md`: Internal gateway to n8n request and response contract.
- `specs/ERROR_MODEL.md`: Canonical error taxonomy and payload shape.
- `specs/WORKFLOW_CATALOG.md`: Workflow ownership, mappings, and export naming.
- `specs/SECURITY_MODEL.md`: Secrets, auth, rate-limit, and audit rules.
- `specs/OBSERVABILITY_SPEC.md`: Logs, metrics, correlation ids, and alert thresholds.
- `specs/CREDITS_PRICING_MODEL.md`: Credit policy and margin-control rules.
- `specs/LAUNCH_RUNBOOK.md`: Cutover and rollback procedure.

## Current Implementation Snapshot
As of March 24, 2026:
- Frontend developer portal exists and is functional with typed mock data.
- Backend gateway and database schema are still not implemented.
- A transcript hot-folder n8n workflow artifact is implemented in `automations/transcript-hot-folder/`.
- All current API behavior in the portal is simulated through the provider boundary.

## Documentation Rules
- If endpoint definitions change, update `frontend/entities/endpoints/model/endpoint-registry.ts` first.
- Then sync `specs/API_SPECIFICATION.md` in the same change.
- If implementation sequencing or architecture decisions change, update `governance/IMPLEMENTATION_PLAN.md`.
- If runtime behavior changes, update `specs/API_SOURCE_OF_TRUTH.md`.
- If gateway-to-n8n behavior changes, update `specs/N8N_HANDSHAKE_SPEC.md` and `specs/ERROR_MODEL.md`.
- If a technical decision closes an ambiguity, log it in `governance/DECISION_LOG.md`.
- Do not treat files outside `docs/` as canonical planning docs unless this file explicitly links them.
