# Credits and Pricing Model

Status: Draft
Owner: Product and backend
Last updated: 2026-03-17
Depends on: `docs/specs/API_SPECIFICATION.md`, `docs/specs/ERROR_MODEL.md`, `docs/specs/OBSERVABILITY_SPEC.md`
Source of truth: This file defines how usage is metered and when credits are charged.

## Purpose
This file defines the credit policy required to build billing and usage accounting without guessing later.

## Metering Rules
- Credits are metered per successful endpoint call in V1.
- Current charging policy: charge only on successful `2xx` completion.
- Do not charge for `4xx`, `5xx`, `timeout_error`, or `upstream_error` responses in V1.
- If partial billing is ever introduced, it requires a new decision-log entry first.

## Endpoint Credit Schedule

| Endpoint slug | Credits per successful call |
| --- | --- |
| `transcripts-by-id` | `1` |
| `curriculum-week` | `1` |
| `knowledge-base-search` | `2` |
| `scrape-website` | `3` |
| `analyze-doc` | `4` |
| `lead-enrichment` | `5` |

## Cost-Control Rules
- Credits per endpoint must be documented in the endpoint registry and API specification together.
- The gateway is the charging authority, not n8n.
- n8n may return `credits_estimate` for observability, but gateway-side records are canonical.

## Public Pricing Posture
- Public pack pricing is not finalized in this doc.
- Any current frontend billing-pack UI values are demo-only until commercial pricing is explicitly approved.
- Public price commitments require Kirk approval before publication.

## Review Cadence
- Revisit credit costs when provider costs, average latency, or failure rates materially change.
- Review margin assumptions before enabling a new automation endpoint for external users.
