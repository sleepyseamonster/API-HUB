# Implementation Plan

Status: Active
Owner: API HUB architecture
Last updated: 2026-03-23
Depends on: `docs/governance/OPERATING_MODEL.md`, `docs/specs/API_SOURCE_OF_TRUTH.md`, `docs/specs/API_SPECIFICATION.md`, `docs/specs/N8N_HANDSHAKE_SPEC.md`
Source of truth: This file defines the current implementation sequence and the architecture decisions that guide build-out.

## Purpose
This file converts research, drafted specs, and current repo state into one execution plan that can drive implementation without re-deciding core architecture on every task.

## Current State
- The portal experience in `frontend/` is the most mature part of the repo.
- Most portal behavior is still mock-backed through the provider boundary.
- `Dashboard Studio` and `local-business-search` prove that server-side integrations can run inside the current repo, but they are not the final platform architecture.
- The backend gateway, Supabase schema, and public live runtime are not implemented yet.

## Locked Decisions

### 1. Gateway Boundary
- The first real public control plane remains a FastAPI gateway under `backend/`.
- Next.js Route Handlers remain portal-side adapters for internal previews and transitional integrations until equivalent gateway routes exist.
- The frontend app should not become the long-term public billing, auth, and execution boundary.

Why:
- Existing architecture docs, vision docs, and agent roles already converge on FastAPI as the control plane.
- A dedicated gateway is a cleaner place for auth, credit logic, request logging, and n8n orchestration.
- This avoids coupling public API contracts to portal deployment concerns.

### 2. Execution Model Policy
- Resource endpoints are sync by default.
- Direct-provider endpoints are sync only when latency is predictably bounded and no durable workflow state is required.
- n8n-backed automation endpoints are async-first.
- Any workflow-backed endpoint that remains sync must earn that exception through an explicit decision-log entry.

Why:
- Studio already behaves like an async job flow.
- Async-first is safer for workflow retries, vendor latency, replay, and billing correctness.
- This reduces future rework when more complex automations are added.

### 3. First Live Endpoint Slice
- The first live public gateway slice is `local-business-search`.
- It will run through the FastAPI gateway, not through the Next.js preview route.
- It launches as a live execution path with shadow metering first.

Why:
- It already has a working preview-backed implementation and typed request/response helpers.
- It does not depend on n8n, which makes it a better gateway-spine validation slice.
- It exercises auth, request validation, provider integration, observability, and pricing instrumentation without forcing job orchestration first.

### 4. First Billing Mode
- The first live slice is shadow-metered, not customer-billed.
- The system must record usage and vendor-cost signals, but must not deduct customer credits yet.
- Paid billing starts only after the internal ledger and idempotency model exist.

Why:
- Billing correctness is a bigger risk than endpoint execution for the first launch.
- Shadow metering validates the event model without creating customer trust failures.

### 5. Durable State Ownership
- Supabase is the durable system of record for platform state.
- Airtable remains a temporary Studio-side integration and must not become the canonical store for executions, billing, or customer-facing job state.
- n8n execution history is not canonical audit state.

Why:
- Durable platform primitives need one queryable source of truth.
- Airtable and n8n are useful operator tools, but neither should own platform-critical state.

### 6. Contract Ownership Transition
- The frontend endpoint registry remains the current portal catalog truth until the first gateway-backed OpenAPI contract is published.
- Once `local-business-search` ships through the FastAPI gateway, OpenAPI becomes the runtime contract owner for that live surface.
- The frontend registry continues to drive simulated endpoints until they are migrated.

Why:
- This keeps the current portal stable while creating a clean path away from doc and runtime drift.

## Build Sequence

### Phase 1. Lock Runtime Foundations
Goal:
- Create the minimum backend skeleton needed to support one real endpoint.

Deliverables:
- `backend/app/` FastAPI application skeleton.
- Shared error envelope aligned with `docs/specs/ERROR_MODEL.md`.
- Request id generation and propagation.
- Structured request logging with no sensitive key exposure.
- Backend README or agent notes updated for local run/test flow.

Exit criteria:
- A FastAPI app boots locally and exposes a health route plus one internal test route.

### Phase 2. Create the First Durable Data Layer
Goal:
- Define the minimum Supabase schema required for auth, usage tracking, and future execution state.

Deliverables:
- `supabase/` migrations directory.
- Initial tables for:
  - workspaces
  - workspace_members
  - api_keys
  - usage_events
  - billing_events
  - executions
- API key storage model based on prefix + one-way hashed secret.
- Clear schema split between public-safe and private/internal tables.

Exit criteria:
- The core schema can represent a workspace, an API key, a live request, and a shadow-metered billing event.

### Phase 3. Ship the Gateway Spine With `local-business-search`
Goal:
- Prove the public gateway path end to end on one live endpoint.

Deliverables:
- `POST /v1/tools/local-business-search` implemented in FastAPI.
- Input validation and normalized response mapping.
- Google Places adapter isolated behind a service boundary.
- Request id in success and error paths.
- Usage event write per request.
- Shadow-meter event write per successful request.

Exit criteria:
- One real public endpoint runs through the gateway, returns the documented envelope, and records usage safely.

### Phase 4. Promote OpenAPI to Runtime Contract Owner
Goal:
- Stop drifting between frontend catalog, docs, and backend behavior for live routes.

Deliverables:
- `openapi/v1.yaml` or generated checked-in OpenAPI artifact.
- Contract tests for the live endpoint.
- Portal docs/snippet generation strategy for live endpoints.
- `docs/specs/API_SOURCE_OF_TRUTH.md` updated to reflect mixed simulated/live mode at route level.

Exit criteria:
- The live route has one canonical machine-readable contract and tests enforce it.

### Phase 5. Add Billing Correctness Before Charging
Goal:
- Build the internal event model needed for real customer billing.

Deliverables:
- Billing event taxonomy.
- Idempotency-key policy for side-effecting requests.
- Credit ledger semantics:
  - debit timing
  - refund/adjustment rules
  - timeout handling
  - replay rules
- Stripe meter mapping design.

Exit criteria:
- A request can be metered and reconciled without ambiguity across retries or failures.

### Phase 6. Add Async Workflow Foundation
Goal:
- Build the durable execution model required for n8n-backed automation endpoints.

Deliverables:
- Execution status resource shape.
- Async job lifecycle states and persistence rules.
- Gateway-to-n8n orchestration path aligned with the handshake spec.
- Replay and deduplication rules for workflow-backed endpoints.
- One candidate workflow endpoint selected for migration after `local-business-search`.

Exit criteria:
- The platform can safely support one async automation endpoint without relying on Airtable as the canonical run state.

### Phase 7. Rework Studio Around Platform Truth
Goal:
- Keep Studio only if it can fit the platform model cleanly.

Deliverables:
- Decision on whether Studio remains productized or internal.
- If productized:
  - migrate execution state ownership to Supabase
  - keep Airtable as optional operator sidecar only
- If internal:
  - label it clearly as operator tooling and keep it outside public platform assumptions

Exit criteria:
- Studio no longer creates confusion about what the real platform execution model is.

## Immediate Next Tasks
1. Scaffold the FastAPI backend app and local run flow under `backend/`.
2. Draft the initial Supabase schema and migrations for workspaces, api keys, usage events, billing events, and executions.
3. Implement `local-business-search` in the gateway using the existing frontend preview code as a reference, not as the runtime boundary.

## Non-Goals For This Pass
- Do not make Stripe the first source of truth for billing state.
- Do not build customer-facing paid credits before the internal ledger exists.
- Do not force n8n-backed endpoints into sync semantics by default.
- Do not expand the endpoint catalog breadth before one live route is operational and observable.

## Success Conditions
- One live gateway-backed endpoint exists.
- The backend has durable request and usage records.
- The portal can distinguish clearly between simulated routes and live routes.
- The repo has one implementation sequence that reduces, rather than increases, contract drift.
