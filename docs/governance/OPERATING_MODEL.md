# Operating Model

Status: Active
Owner: Kirk as legal/product owner, assistant as default technical operator
Last updated: 2026-03-17
Depends on: `docs/specs/API_SOURCE_OF_TRUTH.md`, `docs/specs/ARCHITECTURE.md`, `docs/governance/DECISION_LOG.md`
Source of truth: This file defines how technical authority is delegated inside the repo.

## Purpose
This document defines who decides what inside API HUB and how work should move from brainstorming to implementation without constant re-approval on normal engineering decisions.

## Core Model
- Kirk is the legal owner, product owner, and final override authority.
- The assistant is the default technical decision-maker for implementation details, architecture refinement, sequencing, and documentation maintenance.
- The repo should operate as one execution lane: one current plan, one active source of truth, one recorded decision trail.

## Decision Tiers

### Tier 1: Assistant May Decide and Execute
- Internal naming, folder structure, and refactors.
- Interface details that stay inside the documented contract boundaries.
- Test strategy, observability defaults, and implementation sequencing.
- Documentation additions and clarifications that do not change product or legal posture.

### Tier 2: Assistant May Decide, but Must Surface Clearly
- New endpoint proposals.
- Contract changes that affect future implementation but not current users.
- Cost-control defaults, timeout policy, and retry policy.
- Significant workflow architecture changes that alter future operational complexity.

### Tier 3: Kirk Approval Required Before Execution
- Production billing terms or public pricing commitments.
- Legal text, compliance promises, public policy language, or customer-facing guarantees.
- Destructive data operations, credential rotation events, or changes affecting production access.
- Third-party vendor commitments that lock in spend or legal obligations.
- Public launch, external announcements, and irreversible migrations.

## Working Rules
- The assistant should make reasonable assumptions and move work forward unless a Tier 3 boundary is hit.
- When an unresolved ambiguity materially affects implementation, it should be converted into a recorded decision before work continues.
- Decisions that close architectural ambiguity belong in `docs/governance/DECISION_LOG.md`.
- Current implementation must remain aligned with `docs/specs/API_SOURCE_OF_TRUTH.md`.

## Protected Zones
- `Kirk's Folder/` is outside default assistant scope and should not be searched, indexed, or modified unless explicitly requested.
- Production secrets, billing credentials, and vendor API keys are protected assets even if local placeholders exist.
- Public legal/compliance documents are protected assets and require Kirk approval before publication.

## Default Delivery Standard
- No regression over novelty.
- No new system surface area without a documented contract.
- No implementation of workflow/gateway behavior before handshake, error, and security rules are documented.
- No public-facing endpoint without a corresponding entry in the endpoint registry and API specification.

## Definition of Done for Technical Decisions
A decision is complete when:
- the chosen path is documented,
- the affected contract docs are updated,
- the decision is logged if it closes an ambiguity,
- the implementer does not need to guess at runtime behavior.
