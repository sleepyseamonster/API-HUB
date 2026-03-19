# Decision Log

Status: Active
Owner: API HUB architecture
Last updated: 2026-03-17
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
