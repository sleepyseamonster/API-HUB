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
- `app/(console)/dashboard` console pages (`/dashboard`, `/dashboard/studio`, `/dashboard/keys`, `/dashboard/logs`, `/dashboard/billing`)
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

## Environment
The `Dashboard Studio` flow uses live Airtable + n8n server-side integrations. Create `frontend/.env.local` with:

```bash
AIRTABLE_PAT=your_airtable_pat
AIRTABLE_BASE_ID=appyBbduX3VSjsWGF
AIRTABLE_WORKFLOW_TABLE_ID=tbl2kgaQXi9G16ijU
AIRTABLE_REFINER_AGENT_RECORD_ID=rec5dYNZMCRfEgUAO
N8N_GENERATE_WEBHOOK_URL=https://sleepyseamonster.app.n8n.cloud/webhook/2ca77f7d-033f-4e3e-b253-6a28b0996473
```

Notes:
- The app appends `recordId` and `action=Generate` to `N8N_GENERATE_WEBHOOK_URL`; do not include those query params in the env var.
- Restart the Next dev server after creating or changing `.env.local`.
- The Studio route creates a new Airtable `Workflow` record, links the refiner agent, then triggers the existing n8n workflow unchanged.
- Local Business Search preview is optional and uses:

```bash
GOOGLE_PLACES_API_KEY=your_google_places_api_key
LOCAL_BUSINESS_SEARCH_PREVIEW_ENABLED=true
```

## Vercel Deployment
This repo is a monorepo. The deployable Next.js app lives in `frontend/`.

Set the Vercel project up like this:
- Framework Preset: `Next.js`
- Root Directory: `frontend`
- Install Command: leave default
- Build Command: leave default (`next build`)

Add these Environment Variables in the Vercel project settings:
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_WORKFLOW_TABLE_ID`
- `AIRTABLE_REFINER_AGENT_RECORD_ID`
- `N8N_GENERATE_WEBHOOK_URL`

Optional preview-only environment variables:
- `GOOGLE_PLACES_API_KEY`
- `LOCAL_BUSINESS_SEARCH_PREVIEW_ENABLED`

Notes:
- If `Root Directory` is left at the repository root, Vercel will not detect the actual app correctly because the Next.js project is under `frontend/`.
- `Dashboard Studio` server routes will fail at request time if the Airtable or n8n environment variables are missing.
- `Local Business Search` preview stays disabled unless `LOCAL_BUSINESS_SEARCH_PREVIEW_ENABLED=true`.

## Notes
- Most of the portal is still mock-backed through the provider boundary.
- `Dashboard Studio` is the first live server-integrated path and depends on the env vars above.
- `Local Business Search` can run through a gated internal preview route when the Google env vars are set.
- Theme is locked to the four-color palette in `shared/lib/theme.ts`.
