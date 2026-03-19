# Security Model

Status: Draft
Owner: Backend and infrastructure
Last updated: 2026-03-17
Depends on: `docs/specs/N8N_HANDSHAKE_SPEC.md`, `docs/specs/ERROR_MODEL.md`
Source of truth: This file defines default security controls for the live API platform.

## Purpose
This file defines the minimum controls required before the platform can move from mock mode to live execution.

## API Key Model
- Two environments: `sandbox` and `production`.
- API keys are issued and validated by the gateway.
- Only key prefixes may be displayed after creation.
- Full keys must never be written to logs or analytics events.

## Internal Secrets
- Gateway-to-n8n calls require `X-Internal-Webhook-Secret`.
- Internal webhook secrets must not be exposed to the browser.
- Each environment should use separate internal secrets.

## Logging Restrictions
Never log:
- full API keys
- provider API keys
- webhook secrets
- raw uploaded document contents
- full third-party auth headers

## Rate-Limit Defaults
- Sandbox: `10 requests/minute/key`
- Production: `60 requests/minute/key`
- Automation endpoint concurrency: `5 in-flight requests/key`

These are MVP defaults and should be revisited after real traffic exists.

## Access-Control Rules
- Browser clients should never call n8n directly in production.
- Public clients call the gateway only.
- n8n should trust gateway-originated requests only.

## Audit Minimums
For each live request, record:
- `request_id`
- endpoint slug
- key id
- environment
- status code
- error code if present
- latency
- credits charged

## Release Gate
No live automation endpoint should ship until:
- internal webhook auth exists,
- log redaction rules exist,
- rate limits are enforced,
- request ids are generated and propagated end-to-end.
