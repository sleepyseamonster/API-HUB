# Product Specification

This document details the features and user experience requirements for the API HUB.

## 1. Feature Set

### Developer Dashboard
- **Authentication**: Sign up/Login via Magic Link or GitHub.
- **Key Management**: Generate, revoke, and name API keys (Production & Sandbox).
- **Usage Stats**: Visual charts showing requests over time and credit consumption.
- **Logs**: A searchable table of recent API requests, status codes, and latency.

### API Documentation (The Portal)
- **Reference**: Clean, searchable list of all available endpoints.
- **Playground**: "Try it Now" feature to test APIs directly from the browser using a sandbox key.
- **Code Snippets**: Auto-generated examples in cURL, Python, JavaScript, and Ruby.

### Credits & Billing
- **Credit Balance**: Real-time display of remaining credits.
- **Top-up**: Integration with Stripe for purchasing credit packs.
- **Low-Balance Alerts**: Automated emails when credits fall below a threshold.

## 2. User Experience & "Vibe"
The portal must feel like a premium, high-tier developer tool (similar to **Stripe**, **Vercel**, or **Linear**).

- **Aesthetics**: Dark mode by default, glassmorphism elements, minimal typography, and high-quality micro-animations.
- **Responsiveness**: Fully optimized for desktop and mobile.
- **Onboarding**: A "Quick Start" guide that gets a developer to their first API call in under 60 seconds.

## 3. The API Catalog (Initial V1)

### A. The "Resource Library" (Data Endpoints)
| Endpoint | Type | Description |
| :--- | :--- | :--- |
| `GET /v1/transcripts/{id}` | Sync | Retrieves the full markdown/JSON transcript of a specific masterclass session. |
| `GET /v1/curriculum/week-{id}` | Sync | Returns the structured syllabus and resources for a specific cohort week. |
| `GET /v1/knowledge-base/search` | Sync | Semantic search across all proprietary docs and curriculum materials. |

### B. The "Automation Engine" (n8n Endpoints)
| Endpoint | Type | Description |
| :--- | :--- | :--- |
| `POST /v1/tools/scrape-website` | Sync | Extracts structured markdown/JSON from any URL. |
| `POST /v1/tools/analyze-doc` | Sync | Extracts key data from PDFs/Images using LLMs. |
| `POST /v1/tools/lead-enrichment` | Sync | Takes an email and returns structured LinkedIn/Company data. |
