# API Hub Orchestrator Notes

This directory now supports the canonical `AGENTS.md` instruction chain instead of competing with it.

## What is canonical now
- Repository-wide execution rules live in `AGENTS.md` at the repo root.
- Scoped rules live in `frontend/AGENTS.md`, `backend/AGENTS.md`, and `docs/AGENTS.md`.
- Governance authority lives in `docs/governance/OPERATING_MODEL.md`.
- Current implementation truth lives in `docs/specs/API_SOURCE_OF_TRUTH.md`.

## What this directory is for
- `.agent/skills/` remains the home for reusable skills.
- This file is a human-readable orientation note for the legacy custom agent layout.
- The files under `.agent/roles/` are compatibility pointers to the scoped `AGENTS.md` files.

## Working rule
- When updating instructions, edit the canonical `AGENTS.md` files first so Codex can discover them automatically.
