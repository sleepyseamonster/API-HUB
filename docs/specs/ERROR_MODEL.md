# Error Model

Status: Draft
Owner: Backend contract
Last updated: 2026-03-17
Depends on: `docs/specs/API_SPECIFICATION.md`, `docs/specs/N8N_HANDSHAKE_SPEC.md`
Source of truth: This file defines canonical error codes, status mapping, and payload shape.

## Purpose
All live API errors should resolve to one predictable response shape regardless of whether the failure occurred in the gateway, data layer, or n8n workflow.

## Public Error Envelope

```json
{
  "status": "error",
  "data": {},
  "message": "Validation failed",
  "error": {
    "code": "validation_error",
    "retryable": false,
    "request_id": "req_01H...",
    "details": {}
  }
}
```

## Rules
- `status` is always `error`.
- `data` is always an object and defaults to `{}`.
- `message` is user-facing and concise.
- `error.code` is machine-readable and stable.
- `error.retryable` tells clients whether a retry may succeed without changing input.
- `error.request_id` is required in live mode.

## Error Codes

| Code | HTTP status | Retryable | Meaning |
| --- | --- | --- | --- |
| `validation_error` | `422` | No | Payload shape or value failed validation. |
| `unauthorized` | `401` | No | Missing or invalid credentials. |
| `forbidden` | `403` | No | Authenticated but not allowed for the requested operation. |
| `insufficient_credits` | `402` | No | Request was valid but the account lacks credits. |
| `not_found` | `404` | No | Resource or endpoint target does not exist. |
| `rate_limited` | `429` | Yes | Request exceeded allowed rate or concurrency. |
| `upstream_error` | `502` | Yes | Provider or workflow dependency failed. |
| `timeout_error` | `504` | Yes | Upstream execution exceeded allowed time. |
| `internal_error` | `500` | Maybe | Unexpected server-side failure. |

## Mapping Rules
- Gateway validation failures map to `validation_error`.
- Bad API keys map to `unauthorized`.
- Credit check failures map to `insufficient_credits`.
- n8n/provider failures that return structured errors map to `upstream_error` unless a more specific code exists.
- Uncaught exceptions map to `internal_error`.

## Mock Mode Note
The current frontend playground wraps mock failures in a UI-facing result object. That wrapper is not the public API error contract. The public contract starts when the live gateway exists.
