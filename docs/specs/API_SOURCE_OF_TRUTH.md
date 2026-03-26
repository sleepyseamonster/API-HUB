# API Source of Truth

Status: Active
Owner: API HUB runtime planning
Last updated: 2026-03-24
Depends on: `frontend/entities/endpoints/model/endpoint-registry.ts`, `frontend/shared/contracts/portal-data-provider.ts`, `docs/specs/API_SPECIFICATION.md`
Source of truth: This file defines what is implemented now and where canonical runtime assumptions live.

This document is the single reference for understanding how the API system currently works in this repository.

## Purpose
- Give one clear answer to: "What is implemented now?"
- Separate current state from target architecture.
- Define where each API concept lives in code.
- Prevent mock-mode portal behavior from being confused with live backend behavior.

## State Snapshot (March 24, 2026)
Current state:
- A functional Next.js developer portal exists in `frontend/`.
- Endpoint definitions and examples are implemented as typed frontend data.
- API runs in the UI are simulated through a mock provider, except for the internal preview-backed `local-business-search` playground path and the live demo routes at `/v1/tools/local-business-search` and `/v1/tools/transcript-ingest`.
- The transcript hot-folder watcher in `backend/tools/transcript_hot_folder_watcher.py` supports env-file configuration, watcher status reporting, and macOS launch-agent management for the local ingestion path.

Not implemented yet:
- FastAPI gateway in `backend/`.
- Supabase schema and migrations in `supabase/`.
- Most live n8n workflow exports in `automations/`.
- Production auth, billing, rate limit, and job orchestration.

## Status Matrix

| Subsystem | Current status | Canonical source |
| --- | --- | --- |
| Endpoint catalog | Implemented in frontend | `frontend/entities/endpoints/model/endpoint-registry.ts` |
| Playground execution | Mock + one internal preview-backed endpoint | `frontend/shared/providers/portal-data-provider.ts` |
| Demo public routes | Implemented | `frontend/app/v1/tools/local-business-search/route.ts`, `frontend/app/v1/tools/transcript-ingest/route.ts` |
| Provider boundary | Implemented | `frontend/shared/contracts/portal-data-provider.ts` |
| Dashboard usage, logs, billing, keys | Simulated | `frontend/shared/providers/mock-portal-data-provider.ts` |
| Transcript hot-folder workflow export | Implemented | `automations/transcript-hot-folder/v2026-03-17_r2.json` |
| Public API contract | Drafted | `docs/specs/API_SPECIFICATION.md` |
| Gateway-to-n8n contract | Drafted only | `docs/specs/N8N_HANDSHAKE_SPEC.md` |
| Live gateway | Not implemented | `docs/specs/ARCHITECTURE.md` |
| Live workflows | Not implemented | `docs/specs/WORKFLOW_CATALOG.md` |

## Canonical Sources By Concern

### Governance
- Source: `docs/governance/OPERATING_MODEL.md`
- Owns: decision authority and protected zones.

### Durable Decision Trail
- Source: `docs/governance/DECISION_LOG.md`
- Owns: architecture and contract decisions that remove ambiguity.

### Endpoint Catalog
- Source: `frontend/entities/endpoints/model/endpoint-registry.ts`
- Owns: endpoint slugs, methods, paths, summaries, credits per call, example requests/responses, product grouping.

### API Data Contracts
- Source: `frontend/shared/types/portal.ts`
- Owns: TypeScript interfaces for endpoint specs, keys, billing packs, logs, usage summary, and playground results.

### Provider Boundary
- Source: `frontend/shared/contracts/portal-data-provider.ts`
- Owns: the contract that UI features depend on (`listEndpoints`, `runPlayground`, `listApiKeys`, and similar methods).

### Active Runtime Provider
- Source: `frontend/shared/providers/portal-data-provider.ts`
- Current binding: composed provider that is mostly mock-backed, with an internal preview route for `local-business-search`.

### Mock Behavior
- Source: `frontend/shared/providers/mock-portal-data-provider.ts`
- Owns: simulated latency, random/success/error modes, and demo usage/key/billing data.

### Public API Contract
- Source: `docs/specs/API_SPECIFICATION.md`
- Owns: readable endpoint contract and lifecycle status.

### Internal Runtime Contract
- Source: `docs/specs/N8N_HANDSHAKE_SPEC.md`
- Owns: future gateway-to-n8n request and response shape.

## How API Behavior Works Today
1. UI asks the provider for endpoint data.
2. Provider returns catalog entries from the in-repo registry.
3. Playground runs call the mock provider unless the endpoint has an internal preview path.
4. External callers can hit the live `/v1/tools/local-business-search` demo route directly.
5. Dashboard stats, logs, keys, and billing are mock records.

This means the portal still demonstrates product experience first. Public gateway infrastructure is not live yet, but one endpoint can exercise a gated internal preview path for development.

## Target Runtime
Target architecture is documented in `docs/specs/ARCHITECTURE.md`:
1. Client sends request to API gateway.
2. Gateway validates key and credits.
3. Gateway logs request and routes work.
4. Data comes from Supabase or n8n workflows.
5. Gateway returns a real response and usage impact.

## Change Protocol
When adding or changing an endpoint:
1. Update `frontend/entities/endpoints/model/endpoint-registry.ts`.
2. Update tests touching endpoint search, snippets, or playground behavior.
3. Update `docs/specs/API_SPECIFICATION.md`.
4. If execution ownership changes, update `docs/specs/WORKFLOW_CATALOG.md`.
5. If runtime assumptions changed, update this file.

When moving from mock to live backend:
1. Keep `PortalDataProvider` interface stable where possible.
2. Swap implementation in `frontend/shared/providers/portal-data-provider.ts`.
3. Update `docs/specs/API_SOURCE_OF_TRUTH.md`, `docs/specs/API_SPECIFICATION.md`, `docs/specs/N8N_HANDSHAKE_SPEC.md`, and `docs/specs/ERROR_MODEL.md` in the same change.

## Questions This Document Must Always Answer
- Which endpoints exist right now?
- Which behavior is real vs simulated?
- Where should a new endpoint be defined first?
- What files must change together to avoid drift?
