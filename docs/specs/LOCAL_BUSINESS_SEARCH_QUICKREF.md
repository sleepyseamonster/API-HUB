# Local Business Search Quickref

Status: Active
Owner: API HUB runtime planning
Last updated: 2026-03-24
Depends on: `docs/specs/API_SPECIFICATION.md`, `docs/specs/API_SOURCE_OF_TRUTH.md`
Source of truth: This page is a concise operator cheat sheet for the live demo route.

## What To Call
- Method: `POST`
- URL: `https://<your-domain>/v1/tools/local-business-search`
- Auth: none for the demo route
- Credits: none for the demo route

## Request Body

```json
{
  "query": "med spa",
  "location": "Scottsdale, AZ",
  "limit": 10,
  "include_contact_fields": false
}
```

## Response Shape

```json
{
  "status": "success",
  "data": {
    "query": "med spa",
    "location": "Scottsdale, AZ",
    "results": []
  },
  "message": "Search complete"
}
```

## Result Fields
- `place_id`
- `name`
- `primary_type`
- `address`
- `latitude`
- `longitude`
- `rating`
- `review_count`
- `business_status`
- `google_maps_uri`
- `phone`
- `website`
- `opening_hours`

## n8n Node Settings
- Use an `HTTP Request` node.
- Set the method to `POST`.
- Send JSON.
- Parse `data.results` from the response body.
- Turn on contact enrichment only if you want phone, website, and opening hours.

## Notes
- The portal preview route still exists separately for internal UI use.
- The live demo route is open on purpose for this step.
- Google Places is still called server-side by the API route, not by the browser.
