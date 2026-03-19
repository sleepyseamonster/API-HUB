# n8n Handshake Specification

Status: Draft
Owner: Backend and automation integration
Last updated: 2026-03-17
Depends on: `docs/specs/API_SPECIFICATION.md`, `docs/specs/ERROR_MODEL.md`, `docs/specs/SECURITY_MODEL.md`
Source of truth: This file defines the internal request and response contract between the API gateway and n8n.

## Purpose
This document standardizes how the future gateway will call n8n workflows and how n8n must respond.

## Scope
- Internal only.
- Applies to automation endpoints routed through n8n.
- Does not replace the public API response contract.

## Transport
- Protocol: HTTPS
- Content type: `application/json`
- Auth header: `X-Internal-Webhook-Secret`
- Correlation headers:
  - `X-Request-Id`
  - `X-Endpoint-Slug`
  - `X-Environment`

## Request Envelope
The gateway sends one JSON object to n8n:

```json
{
  "request_id": "req_01H...",
  "endpoint_slug": "scrape-website",
  "mode": "sync",
  "received_at": "2026-03-17T19:00:00.000Z",
  "actor": {
    "key_id": "key_123",
    "environment": "sandbox"
  },
  "policy": {
    "timeout_ms": 25000,
    "max_retries": 0
  },
  "input": {
    "url": "https://example.com/pricing",
    "output": "markdown"
  },
  "trace": {
    "source": "fastapi-gateway",
    "version": "v1"
  }
}
```

## Request Rules
- `request_id` is required and must be unique per gateway attempt.
- `endpoint_slug` is required and must match the public endpoint registry slug.
- `mode` is `sync` for current V1 endpoints.
- `input` contains the validated public payload only.
- n8n should not receive raw API keys or billing credentials.

## Response Envelope
n8n returns one JSON object:

```json
{
  "status": "success",
  "data": {},
  "message": "Scrape complete",
  "error": null,
  "meta": {
    "request_id": "req_01H...",
    "workflow_version": "2026-03-17.1",
    "latency_ms": 1830,
    "source": "n8n",
    "credits_estimate": 3
  }
}
```

## Response Rules
- `status` is required and must be `success` or `error`.
- `data` is required on success and should be an object.
- `message` is always required and human-readable.
- `error` is `null` on success and an object on failure.
- `meta.request_id` must echo the incoming `request_id`.
- `meta.workflow_version` is required for auditability.

## Error Shape from n8n

```json
{
  "status": "error",
  "data": {},
  "message": "Upstream request failed",
  "error": {
    "code": "upstream_error",
    "retryable": true,
    "details": {
      "provider": "firecrawl"
    }
  },
  "meta": {
    "request_id": "req_01H...",
    "workflow_version": "2026-03-17.1",
    "latency_ms": 4012,
    "source": "n8n",
    "credits_estimate": 0
  }
}
```

## Timeout and Retry Rules
- Gateway timeout for sync requests: `25000ms`.
- Current gateway retry policy: `0` automatic retries for workflow execution.
- n8n may retry individual provider calls inside the workflow if the operation is idempotent.
- If n8n exceeds timeout, the gateway maps the result to a `timeout_error`.

## Idempotency Rules
- `request_id` is the idempotency key for gateway-to-workflow correlation.
- Current V1 behavior does not require n8n to deduplicate duplicate requests across process restarts.
- Future async endpoints should add explicit persisted job deduplication.

## Async Migration Path
Current V1 endpoints are sync-first. If an endpoint becomes async later, n8n should return:

```json
{
  "status": "success",
  "data": {
    "job_id": "job_01H...",
    "state": "queued"
  },
  "message": "Job accepted",
  "error": null,
  "meta": {
    "request_id": "req_01H...",
    "workflow_version": "2026-03-17.1",
    "latency_ms": 120,
    "source": "n8n",
    "credits_estimate": 0
  }
}
```
