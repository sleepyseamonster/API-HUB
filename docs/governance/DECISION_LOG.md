# Decision Log

Status: Active
Owner: API HUB architecture
Last updated: 2026-03-23
Depends on: `docs/governance/OPERATING_MODEL.md`
Source of truth: This file is the durable record of architecture and contract decisions.

## Purpose
Use this file to record decisions that remove ambiguity for future implementation.

## Entry Format
Each entry should include:
- Date
- Status
- Decision
- Why it was chosen
- What was rejected
- Rollback trigger

## Active Decisions

### 2026-03-17 - Active
Decision: Canonical planning and operating docs live under `docs/`.

Why it was chosen:
- Keeps project-wide source-of-truth material separate from private working folders.
- Aligns with the repo's existing documentation structure.

Rejected:
- Making a private folder canonical.
- Splitting technical source-of-truth docs across multiple top-level locations.

Rollback trigger:
- The repo is restructured into a multi-package system with distinct product lines.

### 2026-03-17 - Active
Decision: `Kirk's Folder/` is outside default assistant scope.

Why it was chosen:
- Preserves a hard privacy boundary between private notes and project source-of-truth docs.
- Prevents accidental indexing of non-canonical content.

Rejected:
- Implicit assistant access to all top-level folders.

Rollback trigger:
- Kirk explicitly changes the access boundary.

### 2026-03-17 - Active
Decision: Documentation is modular and dependency-first.

Why it was chosen:
- Governance, contracts, and operations change at different rates.
- Smaller docs reduce drift and are easier to update correctly.

Rejected:
- One monolithic planning document.
- Writing launch and operations docs before contracts are fixed.

Rollback trigger:
- Maintenance overhead becomes higher than the cost of consolidation.

### 2026-03-17 - Active
Decision: `frontend/entities/endpoints/model/endpoint-registry.ts` remains the current code-level truth for endpoint catalog data.

Why it was chosen:
- The running portal already depends on it.
- Existing tests and playground docs are built around it.

Rejected:
- Moving endpoint truth into docs before backend runtime exists.

Rollback trigger:
- A live backend schema or OpenAPI source becomes the runtime contract owner.

### 2026-03-17 - Active
Decision: Current API runtime status is simulated, not live.

Why it was chosen:
- The provider binding and playground behavior are mock-driven today.
- This avoids conflating portal UX completeness with infrastructure completeness.

Rejected:
- Treating frontend demos as proof of live backend behavior.

Rollback trigger:
- The provider boundary is switched to a real backend and source-of-truth docs are updated in the same change.

### 2026-03-23 - Active
Decision: Canonical Codex instructions use root and scoped `AGENTS.md` files, while `Research/` remains advisory only.

Why it was chosen:
- Makes the instruction baseline discoverable by standard Codex instruction loading without relying on custom fallback filenames.
- Keeps repo authority separate from exploratory research and legacy custom-agent notes.
- Allows scoped rules to live near the code and docs they govern.

Rejected:
- Keeping `.agent/agents.md` and `.agent/roles/*` as the primary executable instruction layer.
- Treating research notes as repo truth.

Rollback trigger:
- The team adopts a different supported instruction-discovery mechanism and migrates all canonical instructions in one deliberate change.

### 2026-03-23 - Active
Decision: Legacy assistant support material stays under `.agent/`, while canonical Codex instructions may live in root and scoped `AGENTS.md` files.

Why it was chosen:
- Preserves `.agent/` as the home for reusable skills and legacy operator notes.
- Uses Codex's supported instruction discovery model for executable guidance.
- Allows scoped rules to live near the code and docs they govern without making `.agent/` the only executable layer.

Rejected:
- Keeping all assistant material exclusively under `.agent/` even when Codex cannot discover it automatically.
- Spreading non-canonical support material across application folders.

Rollback trigger:
- The repo adopts a different supported instruction model and migrates all canonical and support material in one deliberate change.

### 2026-03-23 - Active
Decision: The canonical implementation plan lives in `docs/governance/IMPLEMENTATION_PLAN.md`.

Why it was chosen:
- The repo already expects implementation decisions to be documented before features are described as agreed.
- A repo-native implementation plan is easier to audit and maintain than chat-only planning.
- This gives one place to translate research and specs into a build sequence.

Rejected:
- Treating `ROADMAP.md` as the only execution plan.
- Leaving implementation sequencing implicit in scattered specs and chat context.

Rollback trigger:
- The project adopts a different canonical planning structure under `docs/`.

### 2026-03-23 - Active
Decision: The first real public control plane remains a FastAPI gateway under `backend/`; Next.js Route Handlers stay as portal-side preview adapters until migrated.

Why it was chosen:
- Existing architecture docs and agent responsibilities already point to FastAPI as the policy and integration boundary.
- A dedicated gateway is a cleaner home for auth, billing, observability, and n8n orchestration.
- This avoids coupling the public API contract to the frontend deployment layer.

Rejected:
- Making Next.js Route Handlers the long-term public gateway by default.
- Treating current preview routes as proof of final backend architecture.

Rollback trigger:
- The repo intentionally adopts a Next-only backend architecture and updates the architecture docs in the same change.

### 2026-03-23 - Active
Decision: Execution mode is mixed by endpoint family; n8n-backed automation endpoints are async-first.

Why it was chosen:
- Workflow-backed operations have higher retry, latency, and replay complexity than resource or direct-provider reads.
- Studio already proves that async execution is a natural fit for workflow-backed behavior.
- Async-first reduces pressure to fake sync semantics for operations that need durable execution state.

Rejected:
- Sync-first for every V1 automation endpoint.
- Deferring execution-mode policy until after gateway implementation starts.

Rollback trigger:
- Live operational evidence shows a workflow-backed endpoint family is predictably bounded and simpler as sync.

### 2026-03-23 - Active
Decision: The first live endpoint slice is `local-business-search` through the FastAPI gateway with shadow metering before customer billing.

Why it was chosen:
- The repo already has a working preview-backed implementation to borrow from.
- It validates the gateway spine without introducing n8n orchestration as the first runtime dependency.
- Shadow metering is safer than live billing while the ledger and idempotency model are still being built.

Rejected:
- Starting paid billing on the first live slice.
- Making the first live slice an n8n-backed workflow endpoint.

Rollback trigger:
- Provider economics, policy constraints, or product direction make another endpoint a better first gateway validation slice.

### 2026-03-23 - Active
Decision: Supabase is the durable system of record for platform state; Airtable remains a temporary Studio-side integration only.

Why it was chosen:
- Platform-critical state needs one durable queryable home for auth, billing, executions, and audits.
- Airtable is useful for operator workflows but is not the right long-term owner for customer-facing execution state.
- This keeps Studio from redefining the platform architecture accidentally.

Rejected:
- Making Airtable the long-term execution-state store.
- Treating n8n execution history as canonical billing or audit truth.

Rollback trigger:
- The platform is intentionally redesigned around a different durable state layer and the schema docs are updated accordingly.

### 2026-03-24 - Active
Decision: `local-business-search` is temporarily exposed as an open Next.js demo route without auth or credits.

Why it was chosen:
- It is the fastest way to demo an externally callable Google Places endpoint.
- The Google API key stays server-side, so the demo avoids exposing provider credentials to the client.
- It keeps the implementation scope small while the gateway and billing layers remain out of scope.

Rejected:
- Blocking the demo on the FastAPI gateway or API key issuance system.
- Reintroducing credits or billing into this demonstration slice.

Rollback trigger:
- The demo graduates to a gateway-backed route or the public launch requirements change.

### 2026-03-24 - Active
Decision: Transcript ingestion uses a local hot-folder watcher that posts one transcript file per n8n execution.

Why it was chosen:
- Bulk transcript uploads are easier to manage as a watched folder than as ad hoc manual form submissions.
- The watcher can preserve local batch state, retries, and per-file results while n8n stays focused on transformation and Airtable writes.
- The workflow contract stays simple: one file in, one normalized batch response out.

Rejected:
- Making the form trigger the canonical bulk-upload path.
- Pushing batch orchestration into n8n instead of keeping it in the local watcher.

Rollback trigger:
- The ingestion path moves into a different orchestrator or the repository adopts a dedicated upload service with the same guarantees.

## Template

### YYYY-MM-DD - Proposed or Active
Decision: Summary sentence.

Why it was chosen:
- Reason one.
- Reason two.

Rejected:
- Alternative one.
- Alternative two.

Rollback trigger:
- Clear event or condition that invalidates the decision.
