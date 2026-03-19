# Legal Boundaries

Status: Active
Owner: Kirk
Last updated: 2026-03-17
Depends on: `docs/governance/OPERATING_MODEL.md`, `docs/specs/SECURITY_MODEL.md`
Source of truth: This file defines internal legal and compliance guardrails for planning and implementation.

## Purpose
This is an internal operating guardrail document. It is not external legal advice and should not be treated as a substitute for counsel.

## Core Boundary
- Kirk is the human legal owner and accountable principal for the project.
- The assistant can draft, design, and implement, but does not hold legal ownership, inventorship, authorship status, or corporate authority.
- Public claims about ownership, compliance, security posture, pricing, or legal rights require Kirk review before publication.

## Authorship and IP Posture
- Human review and acceptance is required for material intended to be treated as owned project IP.
- Assistant-produced drafts and code are project work product only after Kirk accepts them into the repo or operating docs.
- Public legal claims around copyright, patentability, licensing, or exclusivity must not be improvised inside implementation docs.

## Approval-Required Legal Zones
- Terms of service, privacy policy, refund policy, and security guarantees.
- Claims about regulatory compliance or certifications.
- Customer-facing data retention promises.
- Vendor commitments that create contractual or recurring-spend obligations.
- Public statements about scraping legality or rights to third-party data.

## Data and Privacy Guardrails
- Minimize collection of personal data unless it is necessary to deliver the endpoint.
- Do not log full API keys, secrets, raw credentials, or sensitive uploaded document contents by default.
- Do not retain lead or enrichment data longer than required for the product behavior being implemented.
- Any future public retention or deletion promise must be documented and reviewed before launch.

## Jurisdiction Default
- U.S.-first legal and operating assumptions govern the current planning set.
- If a feature introduces region-specific compliance exposure, the requirement must be logged before implementation proceeds.

## Vendor and Platform Guardrails
- Do not assume scraping, enrichment, or AI provider terms allow unrestricted resale.
- When an endpoint depends on a third-party provider, legal and vendor constraints should be documented before launch.
- Provider lock-in or resale restrictions should be treated as launch blockers, not post-launch cleanup items.
