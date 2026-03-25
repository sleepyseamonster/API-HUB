# Project Structure: API HUB

This document defines the organization of the repository to ensure scalability, clarity, and ease of navigation for both human developers and AI agents.

## Root Directory
```text
/
├── .agent/              # AI operator protocols, specialist roles, and skills
│   ├── agents.md        # Orchestrator instructions
│   ├── roles/           # Specialist role definitions
│   └── skills/          # Reusable task-specific instructions
├── assets/              # Branding, visual references, and static images
│   └── reference/       # Loose or exploratory visual assets
├── automations/         # n8n workflow JSON backups and related notes
├── backend/             # Python tooling and future gateway code
│   ├── tests/           # Pytest coverage for backend tools
│   └── tools/           # Local automation utilities
├── docs/                # Project documentation and specifications
│   ├── design/          # Design system, UX flows, and UI resources
│   ├── governance/      # Authority, boundaries, and decision records
│   ├── specs/           # Technical, API, and runtime specifications
│   └── vision/          # Vision, strategy, and roadmap documents
├── frontend/            # Next.js application (The Console)
│   ├── app/             # App Router entrypoints and routes
│   ├── entities/        # Domain models and registries
│   ├── features/        # Feature-level UI and behavior
│   ├── shared/          # Shared contracts, libs, providers, and UI
│   ├── tests/           # Unit, component, and e2e tests
│   └── widgets/         # Page-level composition blocks
├── supabase/            # Database migrations and future local config
├── README.md            # Project entry point
└── ROADMAP.md           # Progress tracking
```

Protected/private folders such as `Kirk's Folder/` are intentionally excluded from the canonical map.

## Folder Descriptions

### `/.agent`
- **agents.md**: Orchestrator rules for cross-functional execution.
- **roles/**: Specialist instructions for docs, frontend, and backend work.
- **skills/**: Reusable workflows such as transcript cleanup and component design.

### `/docs`
- **vision/**: `README_VISION.md`, `WHAT_THIS_IS.md`, `BRAINSTORMING.md`, `PROJECT_STRUCTURE.md`.
- **design/**: `DESIGN_SYSTEM.md`, `UX_FLOWS.md`, `UI_RESOURCES.md`.
- **governance/**: `OPERATING_MODEL.md`, `LEGAL_BOUNDARIES.md`, `DECISION_LOG.md`.
- **specs/**: `ARCHITECTURE.md`, `PRODUCT_SPEC.md`, `AUDIT_REPORT.md`, and runtime contract docs.

### `/backend`
- **tools/**: Local Python tooling, including the transcript hot-folder watcher.
- **tests/**: Pytest coverage for backend tools.

### `/frontend` (Next.js)
- `app/`: Next.js App Router (Dashboard, Public, and API routes).
- `entities/`: Core typed domain models and registries.
- `features/`: Feature slices such as playground, catalog, and key management.
- `shared/`: Shared contracts, libraries, providers, and UI primitives.
- `widgets/`: Section and layout composition.
- `tests/`: Unit, component, and e2e coverage.

### `/supabase`
- `migrations/`: SQL files for schema evolution.

### `/automations`
- A place to store the exported `.json` files from n8n to ensure we have version-controlled backups of the actual logic.
