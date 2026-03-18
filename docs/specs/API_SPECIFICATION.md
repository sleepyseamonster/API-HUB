# API Specification (V1 Draft)

This file is the readable API contract for the current V1 catalog.

Canonical source in code:
- `frontend/entities/endpoints/model/endpoint-registry.ts`

If this document and the registry drift, treat the registry as ground truth and update this file immediately.

## Response Shape Convention
All endpoint examples follow a consistent envelope:

```json
{
  "status": "success | error",
  "data": {},
  "message": "human-readable summary"
}
```

## Authentication and Credits
Current repo status:
- Auth and billing are represented as product concepts in the frontend.
- Real API key verification and credit deduction are not wired to a backend yet.

Planned runtime behavior:
- Requests require an API key.
- Each endpoint consumes credits per successful call.

## Resource Library Endpoints

### 1) Get Transcript
- Method: `GET`
- Path: `/v1/transcripts/{id}`
- Credits per call: `1`
- Job: Returns transcript markdown/JSON for a session id.

Request example:

```json
{
  "id": "masterclass-01",
  "format": "json"
}
```

Response example:

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
- Method: `GET`
- Path: `/v1/curriculum/week-{id}`
- Credits per call: `1`
- Job: Returns week syllabus and resources.

Request example:

```json
{
  "id": 2
}
```

Response example:

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
- Method: `GET`
- Path: `/v1/knowledge-base/search`
- Credits per call: `2`
- Job: Returns semantic search results from proprietary docs.

Request example:

```json
{
  "query": "cold email opener framework",
  "limit": 5
}
```

Response example:

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
- Method: `POST`
- Path: `/v1/tools/scrape-website`
- Credits per call: `3`
- Job: Extracts normalized markdown/JSON from one URL.

Request example:

```json
{
  "url": "https://example.com/pricing",
  "output": "markdown"
}
```

Response example:

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
- Method: `POST`
- Path: `/v1/tools/analyze-doc`
- Credits per call: `4`
- Job: Extracts structured entities from uploaded docs/images.

Request example:

```json
{
  "file_url": "https://cdn.example.com/invoice-1932.pdf",
  "extraction_profile": "invoice_v1"
}
```

Response example:

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
- Method: `POST`
- Path: `/v1/tools/lead-enrichment`
- Credits per call: `5`
- Job: Enriches an email into profile and company metadata.

Request example:

```json
{
  "email": "sara@exampleco.com"
}
```

Response example:

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

## Validation and Error Model (Current)
In mock mode, failed runs return:

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

The exact production error taxonomy is still pending backend implementation.
