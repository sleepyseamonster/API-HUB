# API Source of Truth

This document is the single reference for understanding how the API system currently works in this repository.

## Purpose
- Give one clear answer to: "What is implemented now?"
- Separate current state from target architecture.
- Define where each API concept lives in code.

## State Snapshot (March 16, 2026)
Current state:
- A functional Next.js developer portal exists in `frontend/`.
- Endpoint definitions and examples are implemented as typed frontend data.
- API runs in the UI are simulated through a mock provider.

Not implemented yet:
- FastAPI gateway in `backend/`.
- Supabase schema/migrations in `supabase/`.
- n8n workflow exports in `automations/`.
- Production auth, billing, rate limit, and job orchestration.

## Canonical Sources By Concern

### Endpoint Catalog
- Source: `frontend/entities/endpoints/model/endpoint-registry.ts`
- Owns: endpoint slugs, methods, paths, summaries, credits per call, example requests/responses, product grouping.

### API Data Contracts
- Source: `frontend/shared/types/portal.ts`
- Owns: TypeScript interfaces for endpoint specs, keys, billing packs, logs, usage summary, and playground results.

### Provider Boundary
- Source: `frontend/shared/contracts/portal-data-provider.ts`
- Owns: the contract that UI features depend on (`listEndpoints`, `runPlayground`, `listApiKeys`, etc.).

### Active Runtime Provider
- Source: `frontend/shared/providers/portal-data-provider.ts`
- Current binding: mock provider only.

### Mock Behavior
- Source: `frontend/shared/providers/mock-portal-data-provider.ts`
- Owns: simulated latency, random/success/error modes, and demo usage/key/billing data.

## How API Behavior Works Today (Plain Language)
1. UI asks the provider for endpoint data.
2. Provider returns catalog entries from the in-repo registry.
3. "Try it" calls are simulated, not sent to a live backend.
4. Dashboard stats, logs, keys, and billing are mock records.

This means the portal demonstrates product experience and contract shape, but not live infrastructure yet.

## Target Runtime (Planned)
Target architecture is documented in `docs/specs/ARCHITECTURE.md`:
1. Client sends request to API gateway.
2. Gateway validates key and credits.
3. Gateway logs request and routes work.
4. Data comes from Supabase or n8n workflows.
5. Gateway returns a real response and usage impact.

## Change Protocol (Keep This Reliable)
When adding or changing an endpoint:
1. Update `frontend/entities/endpoints/model/endpoint-registry.ts`.
2. Update tests touching endpoint search/snippets/playground behavior.
3. Update `docs/specs/API_SPECIFICATION.md`.
4. If behavior assumptions changed, update this file.

When moving from mock to live backend:
1. Keep `PortalDataProvider` interface stable where possible.
2. Swap implementation in `shared/providers/portal-data-provider.ts`.
3. Document any contract or response shape changes here and in `API_SPECIFICATION.md`.

## Planning Questions This Document Should Answer
- Which endpoints exist right now?
- Which behavior is real vs simulated?
- Where should a new endpoint be defined first?
- What files must change together to avoid drift?
