# What This Is (The API HUB)

This document defines the core identity, purpose, and value proposition of the **API HUB**.

## 1. The Core Identity
The API HUB is an **All-in-One Resource & Capability Platform** tailored specifically for your cohort students and clients. 

It is a clean, developer-facing interface where your community can access your proprietary information, tools, and processes via simple API endpoints.

## 2. What Exactly Are We Serving?
The API Hub serves two distinct types of endpoints:

### A. Data & Resource APIs (The "Library")
Endpoints that provide programmatic access to your curriculum, knowledge base, and assets.
- **Example API**: `GET /v1/transcripts/{session_id}`
- **Example API**: `GET /v1/curriculum/week-2`
- **Use Case**: A student wants to build their own custom AI assistant that searches through your masterclass transcripts. They use your API to pull the data directly into their app.

### B. Automation & Tool APIs (The "Engine")
Endpoints that trigger your custom n8n workflows and AI processes.
- **Example API**: `POST /v1/tools/document-analyzer`
- **Example API**: `POST /v1/tools/lead-enrichment`
- **Use Case**: A client needs to enrich a list of leads but doesn't have the technical skills to build the scraper. They call your API, which runs your n8n workflow in the background and returns the result.

## 3. The Shift in Delivery Model
Right now, sharing resources (like transcripts or documents) happens via shared folders, Notion pages, or direct messages. Sharing automations requires giving clients access to n8n or building custom frontends.

**The API HUB standardizes everything:**
Instead of sending a PDF, you provide an endpoint.
Instead of sending an n8n JSON file, you provide an endpoint.

You are creating a walled garden of capabilities. Your students and clients get programmatic access to your brain and your tools.

## 4. Who is This For? (The Two Avatars)

### Avatar 1: The Student / Client
- **The Problem**: They want to build custom tools using your teachings, or they want to consume your content programmatically, but the data is locked in raw files or video recordings.
- **The Solution**: They log into the API HUB, generate their unique API key, and browse the endpoint catalog. They can immediately start making requests to pull your transcripts or trigger your automations.
- **The Experience**: They feel like they are accessing an elite, enterprise-grade resource library.

### Avatar 2: The Creator (You)
- **The Problem**: Managing who has access to what, tracking how much your automations are being used, and monetizing access to your data is difficult without a centralized system.
- **The Solution**: The API HUB manages authentication, rate limits, and usage logs. 
- **The Experience**: You upload a new transcript or build a new n8n workflow. You add it to the FastAPI router. Instantly, all your students have access to it via their existing API keys.

## 5. How It Works (The Flow)
1. **The Request**: A student’s app sends a request to `api.yourhub.com/v1/transcripts/masterclass-01` using their API key.
2. **The Verification**: Our FastAPI backend checks the key, ensures the student has active access (and sufficient credits/rate limits), and logs the request.
3. **The Retrieval/Execution**: 
   - *If it's a data asset*: FastAPI fetches the transcript from the database (Supabase) and returns it.
   - *If it's an automation*: FastAPI triggers your n8n webhook, waits for the result, and returns it.

## 6. The Final Result
The API HUB is your "Operating System" exposed to the public. It turns your knowledge, documentation, and automations into a scalable, programmable platform for your community.
