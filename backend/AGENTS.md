# Backend Instructions

This file applies to work under `backend/`.

## Contracts first
- Before changing gateway, auth, logging, or workflow behavior, read the relevant docs in `docs/specs/`, especially `ARCHITECTURE.md`, `N8N_HANDSHAKE_SPEC.md`, `ERROR_MODEL.md`, and `SECURITY_MODEL.md`.
- Keep `docs/specs/API_SOURCE_OF_TRUTH.md` honest about what is real versus planned.
- Do not implement new runtime behavior that creates public surface area without documenting the contract in the same change.

## Backend guardrails
- Use strict validation for request and response boundaries.
- Never log secrets or full API keys in plain text.
- Prefer concrete SQL and explicit constraints over hand-wavy ORM assumptions for non-trivial data rules.
- Keep failure modes explicit and structured.
- Treat local-first and mocked development assumptions as the default unless production credentials and operational requirements are explicitly in scope.

## Validation
- Run the relevant backend tests or tooling available for the touched code.
- If the repo does not yet define a runnable backend toolchain for the change, say so explicitly instead of implying validation happened.
