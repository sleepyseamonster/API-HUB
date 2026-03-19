# Observability Specification

Status: Draft
Owner: Backend and operations
Last updated: 2026-03-17
Depends on: `docs/specs/ERROR_MODEL.md`, `docs/specs/SECURITY_MODEL.md`, `docs/specs/CREDITS_PRICING_MODEL.md`
Source of truth: This file defines what the system must log and measure once live infrastructure exists.

## Purpose
This file defines the minimum telemetry required for debugging, billing trust, and launch readiness.

## Correlation Rule
- Every live request gets a `request_id`.
- The same `request_id` must appear in gateway logs, workflow execution metadata, and public error responses.

## Required Log Fields
- `request_id`
- endpoint slug
- method
- environment
- key id
- status code
- error code
- latency_ms
- credits_spent
- workflow_version when n8n is used

## Required Metrics
- request count by endpoint
- success rate by endpoint
- p50 and p95 latency by endpoint
- error rate by code
- credits consumed by endpoint

## MVP Alert Thresholds
- Any endpoint `5xx` rate above `5%` over 15 minutes.
- Automation endpoint p95 latency above `20s` over 30 minutes.
- Resource endpoint p95 latency above `5s` over 30 minutes.
- Any sudden spike in `unauthorized` or `rate_limited` errors.

## MVP Reliability Targets
- Resource endpoints: `99%` successful responses over 7 days.
- Automation endpoints: `97%` successful responses over 7 days.

## UI Alignment
- Dashboard usage summaries should derive from the same canonical gateway logs used for billing and debugging.
- Mock dashboard data remains non-canonical until live logging exists.
