# API Specification (V1 Draft)

Status: Draft
Owner: API contract
Last updated: 2026-03-17
Depends on: `frontend/entities/endpoints/model/endpoint-registry.ts`, `docs/specs/ERROR_MODEL.md`, `docs/specs/CREDITS_PRICING_MODEL.md`
Source of truth: The endpoint registry is current code truth. This file is the readable contract mirror.

This file is the readable API contract for the current V1 catalog.

If this document and the registry drift, treat the registry as ground truth and update this file immediately.

## Endpoint Lifecycle States
- `simulated`: visible in the portal and backed by mock provider behavior only.
- `live`: backed by the real gateway and runtime systems.
- `deprecated`: still callable but scheduled for removal.

Current repo state:
- All catalog endpoints are `simulated` except `local-business-search` and `transcript-ingest`, which are live as temporary Next.js demo routes at `/v1/tools/local-business-search` and `/v1/tools/transcript-ingest`.
- `local-business-search` also has an internal portal preview path in `frontend/app/api/playground`, but it is not yet a public live gateway route.

## Public Response Envelope
All live endpoint responses should follow:

```json
{
  "status": "success | error",
  "data": {},
  "message": "human-readable summary"
}
```

Public errors add an `error` object as defined in `docs/specs/ERROR_MODEL.md`.

## Authentication and Credits
Current repo status:
- Auth and billing are represented as product concepts in the frontend.
- Real API key verification and credit deduction are not wired to a backend yet.

Planned runtime behavior:
- Requests require an API key.
- Each endpoint consumes credits per successful call only.

## Resource Library Endpoints

### 1) Get Transcript
- Status: `simulated`
- Method: `GET`
- Path: `/v1/transcripts/{id}`
- Mode: `sync`
- Credits per call: `1`
- Job: Returns transcript markdown or JSON for a session id.
- Required inputs: `id`
- Optional inputs: `format`

Request example:

```json
{
  "id": "masterclass-01",
  "format": "json"
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "id": "masterclass-01",
    "title": "Masterclass: Offer Architecture",
    "markdown": "# Session Notes\n- Positioning\n- Offer stack"
  },
  "message": "Transcript fetched"
}
```

### 2) Get Curriculum Week
- Status: `simulated`
- Method: `GET`
- Path: `/v1/curriculum/week-{id}`
- Mode: `sync`
- Credits per call: `1`
- Job: Returns week syllabus and resources.
- Required inputs: `id`
- Optional inputs: none

Request example:

```json
{
  "id": 2
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "week": 2,
    "title": "Outbound Foundations",
    "lessons": ["Lead list quality", "Personalization prompts"]
  },
  "message": "Curriculum loaded"
}
```

### 3) Knowledge Base Search
- Status: `simulated`
- Method: `GET`
- Path: `/v1/knowledge-base/search`
- Mode: `sync`
- Credits per call: `2`
- Job: Returns semantic search results from proprietary docs.
- Required inputs: `query`
- Optional inputs: `limit`

Request example:

```json
{
  "query": "cold email opener framework",
  "limit": 5
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "query": "cold email opener framework",
    "results": [
      {
        "score": 0.92,
        "snippet": "Lead with context, then relevance, then one ask."
      }
    ]
  },
  "message": "Search complete"
}
```

## Automation Engine Endpoints

### 4) Scrape Website
- Status: `simulated`
- Method: `POST`
- Path: `/v1/tools/scrape-website`
- Mode: `sync`
- Credits per call: `3`
- Job: Extracts normalized markdown or JSON from one URL.
- Required inputs: `url`
- Optional inputs: `output`

Request example:

```json
{
  "url": "https://example.com/pricing",
  "output": "markdown"
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "url": "https://example.com/pricing",
    "title": "Pricing",
    "markdown": "# Pricing\nStarter $49..."
  },
  "message": "Scrape complete"
}
```

### 5) Analyze Document
- Status: `simulated`
- Method: `POST`
- Path: `/v1/tools/analyze-doc`
- Mode: `sync`
- Credits per call: `4`
- Job: Extracts structured entities from uploaded docs or images.
- Required inputs: `file_url`, `extraction_profile`
- Optional inputs: none

Request example:

```json
{
  "file_url": "https://cdn.example.com/invoice-1932.pdf",
  "extraction_profile": "invoice_v1"
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "vendor": "Atlas Supplies",
    "total": 842.17,
    "due_date": "2026-03-29"
  },
  "message": "Document analyzed"
}
```

### 6) Lead Enrichment
- Status: `simulated`
- Method: `POST`
- Path: `/v1/tools/lead-enrichment`
- Mode: `sync`
- Credits per call: `5`
- Job: Enriches an email into profile and company metadata.
- Required inputs: `email`
- Optional inputs: none

Request example:

```json
{
  "email": "sara@exampleco.com"
}
```

### 7) Transcript Ingest
- Status: `live`
- Method: `POST`
- Path: `/v1/tools/transcript-ingest`
- Mode: `sync`
- Credits per call: `3`
- Job: Accepts one `.txt` or `.md` transcript file and forwards it into the transcript n8n intake workflow.
- Required inputs: multipart `file`
- Optional inputs: none in the public demo route

Request example:

```bash
curl -X POST http://localhost:3000/v1/tools/transcript-ingest \
  -F "file=@/absolute/path/to/transcript.txt"
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "batch_id": "demo-1711410000000",
    "source_filename": "Week 4 Advanced AI Masterclass Transcript.txt",
    "source_relative_path": "Week 4 Advanced AI Masterclass Transcript.txt",
    "fingerprint": "25d38854d0e06d05c348a4aab17b1dcb5ac32e9c36ba7e7f68f0a7726eea1f28",
    "upstream": {
      "status": "success",
      "message": "Processing completed."
    }
  },
  "message": "Processing completed."
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "full_name": "Sara Quinn",
    "company": "ExampleCo",
    "linkedin_url": "https://linkedin.com/in/saraquinn"
  },
  "message": "Lead enriched"
}
```

### 7) Local Business Search
- Status: `live`
- Method: `POST`
- Path: `/v1/tools/local-business-search`
- Mode: `sync`
- Credits per call: `4`
- Job: Searches for local businesses by keyword and simple text location, with optional contact enrichment.
- Required inputs: `query`, `location`
- Optional inputs: `limit`, `include_contact_fields`
- Demo note: this route is temporarily open and does not enforce API keys or credits.

Request example:

```json
{
  "query": "med spa",
  "location": "Scottsdale, AZ",
  "limit": 10,
  "include_contact_fields": false
}
```

Success response example:

```json
{
  "status": "success",
  "data": {
    "query": "med spa",
    "location": "Scottsdale, AZ",
    "results": [
      {
        "place_id": "ChIJ_example",
        "name": "Example Med Spa",
        "primary_type": "medical_spa",
        "address": "123 Main St, Scottsdale, AZ 85251",
        "latitude": 33.4942,
        "longitude": -111.9261,
        "rating": 4.8,
        "review_count": 214,
        "business_status": "OPERATIONAL",
        "google_maps_uri": "https://maps.google.com/?cid=example",
        "phone": null,
        "website": null,
        "opening_hours": null
      }
    ]
  },
  "message": "Search complete"
}
```

## Validation and Error Model
Mock mode currently returns a UI simulation wrapper that includes `statusCode` and a nested `body`.

Live API behavior should instead follow the public error contract in `docs/specs/ERROR_MODEL.md`.

Current mock failure example:

```json
{
  "status": "error",
  "statusCode": 422,
  "message": "Validation error",
  "body": {
    "status": "error",
    "message": "Request failed validation in mock simulation",
    "data": {}
  }
}
```
