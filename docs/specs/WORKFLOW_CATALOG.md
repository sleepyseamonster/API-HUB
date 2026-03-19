# Workflow Catalog

Status: Draft
Owner: Automation integration
Last updated: 2026-03-17
Depends on: `docs/specs/API_SPECIFICATION.md`, `docs/specs/N8N_HANDSHAKE_SPEC.md`
Source of truth: This file maps public endpoints to runtime execution owners.

## Purpose
This file tracks which system owns execution for each endpoint and how workflow artifacts should be named once exports exist.

## Catalog

| Endpoint slug | Public path | Runtime owner | Workflow name | Status | Target mode |
| --- | --- | --- | --- | --- | --- |
| `transcripts-by-id` | `/v1/transcripts/{id}` | Gateway + data store | None | Simulated | Sync |
| `curriculum-week` | `/v1/curriculum/week-{id}` | Gateway + data store | None | Simulated | Sync |
| `knowledge-base-search` | `/v1/knowledge-base/search` | Gateway + data store | None | Simulated | Sync |
| `scrape-website` | `/v1/tools/scrape-website` | Gateway + n8n | `tool__scrape_website` | Planned | Sync |
| `analyze-doc` | `/v1/tools/analyze-doc` | Gateway + n8n | `tool__analyze_doc` | Planned | Sync |
| `lead-enrichment` | `/v1/tools/lead-enrichment` | Gateway + n8n | `tool__lead_enrichment` | Planned | Sync |

## Runtime Ownership Rules
- Resource endpoints are not n8n workflows by default.
- Automation endpoints are n8n-owned once the live backend exists.
- Gateway owns auth, credits, rate limits, request logging, and public response shaping.
- n8n owns workflow execution, provider orchestration, and normalized workflow output.

## Export Naming Convention
When workflow exports are added to `automations/`, use:

```text
automations/<endpoint-slug>/vYYYY-MM-DD_rN.json
```

Example:

```text
automations/scrape-website/v2026-03-17_r1.json
```

## Versioning Rules
- Increment `rN` when the workflow behavior changes but the public endpoint contract does not.
- If the public contract changes, update `API_SPECIFICATION.md`, `N8N_HANDSHAKE_SPEC.md`, and the decision log in the same change.
- Workflow exports must be traceable to `meta.workflow_version` returned by n8n.
