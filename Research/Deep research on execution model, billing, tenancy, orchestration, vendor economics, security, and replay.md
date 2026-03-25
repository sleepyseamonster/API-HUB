# Deep research on execution model, billing, tenancy, orchestration, vendor economics, security, and replay

## Context and scope

Your current repository (as described) is “mostly frontend + mocks,” with a production platform planned in local README files. The key architectural risk is that the frontend experience already implies *two different backends*: Studio behaves like an asynchronous job system, while the playground implies synchronous request/response APIs. Those two expectations cascade into almost every other irreversible choice: billing semantics, retries, idempotency, error contracts, data model, and observability. citeturn6search0turn6search12

This report focuses on decision-driving questions you can answer *before* implementing a gateway and database schema, using current vendor documentation for HTTP semantics, Stripe billing meters, Supabase RLS, n8n scaling/reliability features, Airtable rate limits, and Google Places pricing/caching constraints. citeturn0search1turn0search4turn10search2turn14search1turn3search0turn1search1turn8search1

## Backend contract and execution model

HTTP itself supports asynchronous processing, but it does **not** provide a way to “later send the final result” for a request that returned `202 Accepted`. RFC 9110 explicitly calls out that 202 means “accepted for processing, but processing has not been completed,” and there is “no facility in HTTP for re-sending a status code from an asynchronous operation.” This pushes you toward a *separate* status resource (polling) and/or webhooks/callbacks for completion. citeturn6search0turn6search12turn6search11

**What the contract must specify (non-negotiables):**

A stable execution contract typically needs:
- A **request identifier** (correlation) and an **execution/run identifier** (durable unit of work), regardless of sync or async. This aligns with standard distributed tracing header propagation (e.g., `traceparent`) so you can correlate gateway logs, vendor calls, workflow runs, and billing events. citeturn5search2turn5search5turn9search0
- A **status resource** shape if any operation can take longer than a normal client timeout, and if retries are possible anywhere in the chain. Microsoft’s long-running operation patterns are an explicit example: `202 Accepted` + `Location` header to a status endpoint, with polling guidance; Azure also documents using a `Location` header for “status of an asynchronous request.” citeturn6search3turn6search7turn6search11
- A **standard error envelope** that is safe to expose publicly. RFC 9457 (which obsoletes RFC 7807) defines `application/problem+json` as the media type for machine-readable “problem details,” which is a strong default for your public API error contract. citeturn6search2turn11search2turn11search8

**The sync vs async decision**

A practical way to resolve the “Studio async vs playground sync” tension is to adopt a mixed model **by endpoint**, but with one consistent “execution vocabulary” across all endpoints:
- **Synchronous endpoints**: return `200/201` with final data when response time is predictably short and no external fan-out is required.
- **Asynchronous endpoints**: return `202 Accepted` + a `Location` (or your own `status_url`) to poll, optionally also supporting completion webhooks. This matches HTTP guidance (RFC 9110/MDN) and common cloud API long-running patterns. citeturn6search0turn6search12turn6search11

Your repo’s “Studio submit → create record → trigger workflow → poll status” behavior (as you described) already fits the async model. The “playground” experience can stay synchronous **only** for endpoints that do not trigger workflows, do not require retries, and have bounded vendor latency. When in doubt, the safe default for workflow-backed operations is async, because webhook processors, queue mode, retries, and vendor rate limits all push you toward non-blocking completion. citeturn15search17turn7search0turn3search0turn6search0

**Next.js Route Handlers implication: caching and runtime**

If your gateway is implemented with Next.js Route Handlers, the caching model is part of the backend contract. Next.js documents Route Handlers as custom request handlers in the `app` directory. citeturn1search0

Next.js 15 specifically changed defaults so that `GET` Route Handlers are **not cached by default** (whereas earlier versions cached by default unless made dynamic). That matters for status/poll endpoints: you generally do *not* want caching unless you can guarantee proper invalidation. citeturn1search9turn1search17turn1search6

Next.js also exposes route segment config (including runtime and `maxDuration`) which can constrain long-running requests. This is another reason to avoid “wait for workflow completion inside the request,” and instead model workflow execution as async. citeturn1search15turn6search0

## Credits and billing architecture with Stripe meters

Stripe’s billing platform has shifted to a “meter-first” model. In the March 31, 2025 API version, Stripe removed support for legacy usage-based billing: you can’t create a metered price without specifying a meter, and Stripe removed legacy fields like `aggregate_usage` and (temporarily) `billing_thresholds`. citeturn0search1turn0search5turn0search13

Stripe later reintroduced `billing_thresholds` (May 28, 2025) as no longer deprecated on the same API version line, but the larger point remains: designing around **meters and meter events** is the forward-compatible path. citeturn0search0turn0search33

**How Stripe meters work (relevant details you should design around)**

Stripe documents usage-based billing as an ingestion lifecycle where you “record usage” into a meter via meter events. Stripe describes meter events as containing:
- An event name (matching the configured meter),
- A customer identifier,
- A numeric usage value,
- An optional timestamp,
- An optional unique identifier for idempotency (and optional dimensions). citeturn9search2turn5search12turn11search15

Some critical operational properties:
- Stripe processes meter events **asynchronously**, so “aggregated usage” might not immediately reflect recently received events. citeturn0search16turn9search5
- Stripe strongly encourages idempotency for usage reporting: you can send an explicit meter event `identifier` to prevent duplicates; if you don’t, Stripe generates one. citeturn9search5turn11search19turn11search7
- Stripe’s general API-level idempotency uses the `Idempotency-Key` header for safely retrying create/update requests, and Stripe documents that idempotency keys have retention/expiry behavior (e.g., guidance that keys are handled for a bounded window). citeturn5search1turn5search4turn9search8

**Decision that drives everything: “Stripe meter mirror” vs “internal credit ledger”**

You need to map “API call,” “workflow run,” “tokens,” and “long-running job retries” into billable units. Stripe meters can represent many of these, but the question is *where truth lives*.

A robust design usually treats Stripe as the settlement layer and keeps an internal immutable ledger as the system of record for:
- usage events,
- credit debits/credits,
- dispute resolution,
- refunds/adjustments,
- deduplication across retries and partial failures.

This recommendation is driven by Stripe’s asynchronous processing of meter events and the reality that your platform will have at-least-once delivery at some boundaries (webhooks, queue workers, client retries). You want your own durable, queryable “why was I charged” trail even when Stripe hasn’t yet aggregated the meter summary, or when you need to reconcile after outages. citeturn0search16turn9search5turn6search0turn7search14

**Concrete research outputs to finalize before building the gateway**

A stable billing/credits design can be expressed as a small set of decisions:
- **Billable event taxonomy**: define the canonical events you record (e.g., `api.request`, `workflow.run.started`, `vendor.call.google.places.text_search`, `workflow.retry`, `workflow.run.completed`). Stripe meters are naturally event-based. citeturn5search12turn11search15
- **Idempotency rules**: define what makes an event “the same” across retries (typically a run id + step name + attempt). Stripe supports an event-level unique identifier for meter events, which you can set from your internal event id. citeturn9search5turn11search19turn11search7
- **Timestamp policy**: Stripe constrains meter event timestamps (must be within a window; e.g., “past 35 calendar days” and small future skew allowance), which affects backfilling and recovery design. citeturn5search19turn9search5
- **Threshold strategy**: if you want to cap risk exposure (runaway usage), Stripe billing thresholds exist, but you still need internal controls (rate limits, quota checks) because thresholds are invoicing mechanics, not a complete abuse-prevention strategy. citeturn0search33turn11search17turn3search0

## Auth, tenancy, and data modeling in Supabase

Supabase’s security model is built around Postgres Row Level Security (RLS) and JWT-based identity. Supabase documentation is explicit that:
- tables in the `public` schema are accessible via the Data API by default,
- to restrict access, you must enable RLS and write policies,
- service role keys bypass RLS and should never be exposed client-side. citeturn9search6turn4search2turn10search2

Supabase also explicitly recommends creating a **private schema** for tables you do not want to expose via the Data API, and still recommends enabling RLS even for private tables, then connecting with a Postgres role that has `bypassrls` privileges for system-level access. citeturn9search3turn10search5turn10search1

At the database level, Postgres documentation defines RLS policies via `CREATE POLICY`, and clarifies that row-level security must be enabled per table for policies to apply. citeturn4search3turn4search7

**Tenant boundary decision: what you must choose early**

Your listed tenancy questions are the right ones because they become foreign keys, RLS conditions, and audit constraints:
- Is a tenant a **business account/workspace** with many users?
- Are API keys scoped to a workspace and optionally scoped by endpoint/product?
- Do you have separate **service accounts** vs human users?
- How do you model **internal staff access** and impersonation?
- What is your audit trail boundary (per workspace vs global)? citeturn11search17turn4search2turn4search3

A common, RLS-friendly approach is:
- `workspaces` (tenant)
- `workspace_members` (user membership + role)
- `api_keys` (workspace-scoped bearer credentials, with scopes)
- `executions` / `runs` (workspace-scoped jobs)
- `billing_events` (workspace-scoped immutable ledger)

This is consistent with OWASP multi-tenant security guidance emphasizing tenant isolation and preventing cross-tenant access. citeturn11search17turn4search2

**Supabase access pattern: Data API vs direct Postgres**

Supabase provides multiple connection modes; the “transaction mode” pooler connection string is described as ideal for serverless/edge functions with many transient connections. Direct connection is described as ideal for persistent servers (VMs, long-lived containers). citeturn10search0

This matters because:
- Browser-facing flows often benefit from **Data API + RLS**, with the user JWT scoping row access. Supabase documents that the client libraries send the user auth token and RLS policies scope access row-by-row. citeturn10search7turn9search6turn10search2
- Server-side “platform internals” (billing ledger writes, job dispatch, worker reconciliation) often benefit from **direct Postgres** (or pooler) and a tighter “private schema” boundary, to avoid accidentally exposing sensitive tables via Data API. citeturn10search5turn10search0turn9search3

From a risk standpoint, Supabase documentation is blunt: never expose the service role key in the frontend; treat it as a secret and keep it backend-only because it bypasses RLS. citeturn10search2turn0search6turn10search1

## n8n as an execution engine: auth, idempotency, retries, queue mode, and durability

n8n’s own documentation supports two different “faces” that matter for your platform:

**Inbound execution (webhooks)**  
The Webhook node supports multiple authentication modes: Basic auth, Header auth, JWT auth, or none. This gives you options for how your gateway authenticates to n8n (and how you authenticate third parties calling n8n directly, if you ever allow it). citeturn1search2turn2search13turn14search0

n8n also makes the webhook payload limit explicit: the Webhook node maximum payload size is 16 MB by default, configurable via `N8N_PAYLOAD_SIZE_MAX`. n8n’s environment variables reference confirms `N8N_PAYLOAD_SIZE_MAX` default is 16 MiB, and also exposes `N8N_FORMDATA_FILE_SIZE_MAX` defaults and limits for form-data uploads. citeturn14search0turn14search1

This is directly relevant to your “hot folder watcher posts multipart files to n8n” scenario: if transcript files can exceed these limits (or if reverse proxies also enforce their own body limits), the correct architectural boundary is usually “upload to object storage, then send metadata + signed URL to n8n.” The payload limits and form-data constraints are the forcing function. citeturn14search0turn14search1turn11search0

**Operational scalability (queue mode and webhooks)**  
n8n documents queue mode as the best scalability mode: “scale up and down by adding workers.” citeturn0search3turn15search17

Queue mode documentation includes webhook processor concepts (separating HTTP intake from execution) and exposes a key deployment control: `N8N_DISABLE_PRODUCTION_MAIN_PROCESS` can “disable production webhooks from main process,” reducing HTTP load on the main process when using webhook-specific processes. citeturn15search1turn15search4turn14search1

n8n also provides scaling guidance about concurrency: worker concurrency defaults (and recommendations) exist, and n8n warns that low concurrency with many workers can exhaust database connection pools. citeturn4search21turn10search16

**Retry and failure behavior**  
Retry semantics are where billing leakage and duplicate side effects show up:

- At the node level, n8n’s HTTP Request node supports “Retry on Fail” with configurable max tries and delay. That means the *same workflow run* can generate multiple upstream API calls automatically when a vendor is flaky. citeturn7search0
- n8n supports error workflows: you can configure an “Error Workflow” that runs when an execution fails, and you can capture failure details via the Error Trigger node. citeturn7search1turn7search10turn7search7
- n8n’s concurrency control documentation contains an important operational constraint: “You can’t retry queued executions.” It also describes how queued executions are resumed/re-enqueued on startup. This influences how you design replay: your platform may need its own dead-letter + replay mechanism rather than relying on re-running n8n jobs. citeturn7search14turn15search17

**Execution data retention (audit vs cost)**  
n8n enables pruning of execution data by default, and documents that pruning marks then deletes executions for performance reasons. If your platform needs long-lived audit trails for billing disputes and customer support, you should not treat n8n’s own execution history as the primary system of record. citeturn4search1turn15search17turn11search16

n8n also recommends configuring pruning for GDPR practicality in self-hosted deployments, reinforcing that “execution data retention” has compliance implications. citeturn4search17turn4search1

**Idempotency boundary: where n8n ends and your gateway begins**

n8n can help with auth, retries, and scaling, but “exactly-once side effects” is not something you can assume in a workflow engine built around webhooks and retries. The safe pattern is: your gateway defines the canonical idempotency key and persists it in your database; workflows become “at-least-once,” and you make side effects idempotent. This aligns with both industry reality (webhook retries) and n8n’s own ecosystem: n8n publishes an “idempotency gate” workflow template that records an idempotency key and blocks duplicates within a window. citeturn7search15turn7search14turn6search0

## Airtable and Google Places as vendor constraints on architecture

### Airtable as an operational dependency

Airtable’s published API limits are tight and should inform architecture for any flow that polls or writes frequently:
- 5 requests/sec **per base** across all tiers.
- 50 requests/sec for all traffic using personal access tokens from a given user or service account.
- Exceeding limits yields HTTP 429, and Airtable states you must wait 30 seconds before subsequent requests will succeed. citeturn3search0turn3search2

Airtable also documents techniques that reduce API pressure:
- batching (up to 10 records per request),
- `performUpsert` to find/create/update in a single call,
- caching and proxying read-heavy paths. citeturn3search0

This means that an architecture where Studio submits write a record *and then the UI polls Airtable status repeatedly* is likely to hit hard ceilings as usage grows—especially because polling scales with active users, not just workflow volume. Designing Postgres as the system of record and treating Airtable as:
- an operator UI surface,
- a sidecar for manual review,
- or a temporary bootstrapping tool,
reduces the risk that Airtable limits become your platform’s global throughput limit. citeturn3search0turn10search5turn4search3

### Google Places preview economics and product limits

Places API (New) billing is explicitly sensitive to the **field mask**:
- For Place Details (New), Nearby Search (New), and Text Search (New), you specify fields via the `FieldMask` header.
- You are billed at the **highest SKU** applicable to the fields you selected (e.g., if you mix Essentials + Pro fields, you pay Pro). citeturn1search1turn1search4turn1search14

Google’s documentation also makes field masks mandatory: omitting the field mask (or specifying none) results in an error. citeturn1search4turn1search14

The Text Search (New) documentation states:
- default is 20 results per page,
- `pageSize` cannot exceed 20 (values above are coerced to 20),
- paging uses `nextPageToken`/`pageToken`. citeturn4search0turn13search9turn13search0

Separately, Google’s Places web service FAQ states that a Nearby Search can return up to 60 results split across three pages, which is a useful planning bound for “how much enrichment can one search trigger.” citeturn13search18

**Caching and retention constraints (often missed, but architecture-shaping)**  
Google Maps Platform service-specific terms restrict caching: for Places API (Legacy and New), customers may temporarily cache latitude/longitude values for up to 30 consecutive calendar days, after which they must delete them. citeturn8search1turn8search4

However, Google’s Places API “policies and attributions” doc notes an important exception: **place IDs are exempt** from caching restrictions and can be stored indefinitely. citeturn8search2turn8search17

Google’s cost management guidance reiterates: most Maps Platform products prohibit caching, with limited exceptions (often 30 days) as defined in the terms. citeturn8search7turn8search1

These constraints imply clear product decisions for your preview endpoint:
- Implement a field-mask strategy that makes contact enrichment (phone/website/address details) explicitly optional, because adding Pro fields can move you into a higher SKU. citeturn1search1turn1search4turn1search14
- Cache **place IDs** and your own derived “customer values,” but treat raw Places content as time-limited where required, and design refresh/reconciliation accordingly. citeturn8search2turn8search1turn8search7

## Security, observability, and replay model

### Security model for live integrations

Security requirements are architecture requirements, not a checklist you apply later. Your listed concerns map cleanly to established best-practice sources:

- OWASP’s Secrets Management guidance emphasizes centralized storage, provisioning, auditing, rotation, and management of secrets to reduce leakage and simplify compromise response. citeturn11search0
- OWASP’s REST Security guidance emphasizes HTTPS-only endpoints to protect credentials in transit (passwords, API keys, JWTs), and suggests mutual TLS for highly privileged services. citeturn11search11turn10search2
- OWASP’s Logging cheat sheet focuses on building logging mechanisms with security in mind (the basis for audit trails and incident response). citeturn11search16turn11search17
- OWASP’s API Security Top 10 highlights recurring risks like broken authentication and authorization failures, which are especially relevant when you have API keys, multi-tenant data, and workflow-triggering endpoints. citeturn5search14turn5search23turn11search17

For webhook authenticity specifically, Stripe’s webhook documentation explains that Stripe signs webhook payloads and each webhook endpoint has a unique secret used to verify signatures—this is a concrete, production-grade model you can emulate for your own outgoing webhooks or inbound third-party webhooks. citeturn5search13turn9search19

For n8n, the security surface is real: n8n has a built-in “security audit” feature that reports risky nodes and credential usage and can be run via CLI or API. n8n also provides SSRF protection controls via environment variables that restrict which hosts/IP ranges nodes can call, which matters if workflows can hit user-controlled targets. citeturn15search3turn15search2turn15search0

### API key issuance and storage

API keys are bearer credentials; if your database is compromised and you store keys in plaintext, the attacker can impersonate customers. A widely-used pattern is to show the key only once at creation and store only a hash thereafter.

Examples from existing systems and libraries:
- The `djangorestframework-api-key` security docs describe an API key format with a prefix + secret, and state that only a hashed version is stored; the full key is shown only once. citeturn12search6
- Octopus Deploy documents moving to hashed-and-salted API keys (PBKDF2) so keys become non-retrievable from the UI, explicitly analogizing API keys to passwords. citeturn12search24
- OWASP password storage guidance explains why one-way hashing is preferable to reversible encryption when you don’t need to recover the secret—this is directly applicable to customer API keys, where validation is “compare hash,” not “decrypt.” citeturn12search0

This intersects directly with billing and idempotency: if you adopt hashed API keys, you still need stable key identifiers (prefix/fingerprint) for “last used,” audit trails, revocation, and per-key scopes—without storing the raw secret. citeturn11search16turn11search17turn9search5

### Observability and replay as a data model

Distributed systems need correlation identifiers that survive across services and vendors.

Two standards-based building blocks:
- W3C Trace Context defines the `traceparent` (and `tracestate`) headers for propagating trace identity across service boundaries. citeturn5search2turn5search5
- OpenTelemetry defines the concepts and signal model (traces, metrics, logs) used to collect and correlate telemetry across a distributed system. citeturn9search0turn9search16turn9search10

For your platform, the “minimum viable event model” that supports billing disputes, replay, and security investigations usually includes:
- immutable **request log** entries (request id, API key fingerprint, tenant id),
- immutable **execution/run** entries (run id, workflow id, status transitions),
- immutable **vendor call** entries (vendor, endpoint, cost classification, request/response metadata redacted safely),
- immutable **billing/credit events** (internal event id, amount, reason, Stripe meter mapping idempotency identifier),
- explicit **retry attempts** (attempt number, retry reason, idempotency key), with replay rules constrained to idempotent steps.

This “immutable append-only ledger” approach is aligned with Stripe’s emphasis on idempotent usage reporting and meter-event identifiers, and with the practical reality that webhooks and queue workers operate at-least-once under failure. citeturn9search5turn11search19turn6search0turn7search14

For your public error contract, RFC 9457 problem details (`application/problem+json`) provides a standardized way to present safe, structured error responses while keeping operator-only detail out of customer-facing payloads. citeturn11search2turn6search2turn6search0

## Additional decision-driving topics worth deep research

Beyond your priority list, there are a few areas that often become “expensive rewrites” if discovered late, especially in workflow + billing platforms:

- **Abuse controls and rate limiting policy**: differentiate between per-API-key limits, per-tenant quotas, and per-endpoint cost controls. This interacts with Airtable’s hard rate limits, Google Places cost exposure, and Stripe billing thresholds. citeturn3search0turn8search7turn0search33
- **Data retention and privacy posture**: n8n explicitly discusses pruning execution data for GDPR practicality; if you store workflow inputs/outputs that could include PII, you need explicit retention windows and deletion semantics tied to your own audit trail. citeturn4search17turn4search1turn15search8
- **Schema governance and exposure model**: Supabase recommends private schemas for non-Data-API tables; deciding early which tables belong in `public` vs `private` determines your entire security posture. citeturn10search5turn9search6turn10search2
- **Workflow engine isolation and SSRF posture**: n8n provides SSRF protection knobs; if workflows can make HTTP calls to user-controlled targets, SSRF becomes a first-class threat model item. citeturn15search2turn15search0turn5search14