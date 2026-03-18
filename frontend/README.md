# API HUB Frontend

UI-first foundation for the API HUB developer portal.

## Stack
- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- Vitest + Testing Library
- Playwright (smoke e2e)

## Architecture
- `app/(public)` public docs-first pages (`/`, `/quickstart`, `/apis`, `/apis/[slug]`)
- `app/(console)/dashboard` console pages (`/dashboard`, `/dashboard/keys`, `/dashboard/logs`, `/dashboard/billing`)
- `entities` domain-level data (endpoint registry + search helpers)
- `features` user-facing capabilities (catalog explorer, playground, keys, logs)
- `widgets` composite layout/navigation sections
- `shared` provider contracts, mock provider, primitives, and utilities

All UI data is read through the `PortalDataProvider` boundary (`shared/contracts` + `shared/providers`).

## Commands
```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Notes
- Backend wiring is intentionally deferred; this pass uses a typed mock provider.
- Theme is locked to the four-color palette in `shared/lib/theme.ts`.
