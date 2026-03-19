# Launch Runbook

Status: Draft
Owner: Release operations
Last updated: 2026-03-17
Depends on: `docs/specs/SECURITY_MODEL.md`, `docs/specs/OBSERVABILITY_SPEC.md`, `docs/specs/N8N_HANDSHAKE_SPEC.md`
Source of truth: This file defines the cutover and rollback process for the first live endpoint launch.

## Purpose
This runbook covers the move from mock mode to the first live gateway and n8n-backed endpoint.

## Preflight Checklist
- Handshake spec is implemented and tested.
- Error model is implemented and returned consistently.
- Security controls from `SECURITY_MODEL.md` are in place.
- Request ids are visible end-to-end.
- Logs and metrics are queryable.
- Billing logic is disabled or verified according to the active launch scope.

## Cutover Sequence
1. Enable a single live endpoint behind the gateway.
2. Keep all other endpoints on mock behavior if they are not ready.
3. Run smoke requests for success, validation failure, auth failure, and upstream failure.
4. Verify request ids, status codes, and latency logs.
5. Verify credits are charged only on successful calls.

## Smoke Scenarios
- Valid request returns `200` with the documented envelope.
- Invalid payload returns `422` with `validation_error`.
- Missing/invalid key returns `401`.
- Simulated upstream failure returns `502` with `upstream_error`.
- Timeout path returns `504` with `timeout_error`.

## Rollback Triggers
- Handshake responses do not match the documented envelope.
- Request correlation is missing.
- Error mapping is inconsistent across identical failures.
- Unexpected billing or credit deduction occurs.
- Production secrets or internal headers are exposed.

## Rollback Action
1. Disable the live endpoint route or switch the provider binding back to mock mode.
2. Preserve logs for the incident window.
3. Record the failure and cause in the decision log.
4. Do not re-enable until the root cause is documented and verified.
