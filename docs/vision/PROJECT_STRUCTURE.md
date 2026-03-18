# Project Structure: API HUB

This document defines the organization of the repository to ensure scalability, clarity, and ease of navigation for both human developers and AI agents.

## Root Directory
```text
/
├── .agent/              # AI Agent protocols and workflows
│   ├── skills/          # Specialized logic and utility folders
├── assets/              # Branding, icons, and static images
├── backend/             # FastAPI application (The Bouncer)
├── frontend/            # Next.js application (The Console)
├── docs/                # Project documentation and specifications
│   ├── design/          # Design system, UX flows, and UI resources
│   ├── specs/           # Technical, API, and Database specifications
│   └── vision/          # Vision, strategy, and roadmap documents
├── supabase/            # Database migrations, seeds, and config
├── automations/         # n8n workflow JSON backups
├── README.md            # Project entry point
└── ROADMAP.md           # Progress tracking
```

## Folder Descriptions

### `/docs`
- **vision/**: `README.md` (copy), `WHAT_THIS_IS.md`, `BRAINSTORMING.md`.
- **design/**: `DESIGN_SYSTEM.md`, `UX_FLOWS.md`, `UI_RESOURCES.md`.
- **specs/**: `ARCHITECTURE.md`, `PRODUCT_SPEC.md`, `AUDIT_REPORT.md`.

### `/.agent/skills`
- **transcript_alchemist/**: Rules for cleaning and structuring transcripts.
- **component_lab/**: Blueprints for "Machine Console" UI components.

### `/backend` (FastAPI)
- `main.py`: Entry point.
- `app/`: Core logic (auth, routes, models).
- `tests/`: Pytest suite.

### `/frontend` (Next.js)
- `app/`: Next.js App Router (Dashboard and Public).
- `components/`: Modular UI components.
- `lib/`: Utilities and hooks.

### `/supabase`
- `migrations/`: SQL files for table creation.
- `seed.sql`: Sample data for development.

### `/automations`
- A place to store the exported `.json` files from n8n to ensure we have version-controlled backups of the actual logic.
