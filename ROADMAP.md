# Project Roadmap: API HUB

This roadmap outlines the journey from initial brainstorming to a fully functional community API platform.

## Phase 1: Brainstorming & Vision (100% COMPLETE)
- [x] Define Core Identity (`WHAT_THIS_IS.md`)
- [x] Establish Design Language (`DESIGN_SYSTEM.md`)
- [x] Set Agent Protocols (`.agent/agents.md`)
- [x] **New**: Implement Multi-Agent Orchestration (`.agent/*.agent.md`)
- [x] Map UX Screen Architecture (`UX_FLOWS.md`)

## Phase 2: Technical Specifications (CURRENT)
- [ ] **Database Schema**: Define columns, types, and logic for users, keys, and credits.
- [ ] **API Catalog Detail**: Define the exact Input/Output JSON for every endpoint.
- [ ] **The n8n Handshake**: Set the strict contract for how the Backend talks to n8n.
- [ ] **Project Structure**: Define the folder layout for the FastAPI and Next.js apps.

## Phase 3: Infrastructure Setup
- [ ] Initialize Supabase project (Database + Auth).
- [ ] Setup Repository Boilerplate (FastAPI & Next.js skeletons).
- [ ] Configure Environment Variables (`.env.example`).
- [ ] Setup basic Deployment Pipeline (Vercel/Railway).

## Phase 4: The "Bouncer" (Backend Core)
- [ ] Implement API Key generation and validation.
- [ ] Build the usage logging system (Tracking hits).
- [ ] Build the logic for checking and deducting credits.
- [ ] Implement the n8n Proxy/Gateway logic.

## Phase 5: The "Console" (Frontend Portal)
- [ ] Build the landing page & documentation site.
- [ ] Create the Developer Dashboard.
- [ ] Implement API Key management UI.
- [ ] Build the "Playground" (Testing console).

## Phase 6: Service Integration & Launch
- [ ] Connect the first 3 "Resource" APIs (Transcripts, Docs).
- [ ] Connect the first 3 "Automation" APIs (n8n workflows).
- [ ] End-to-end testing with students/clients.
- [ ] **LIFTOFF!**

---
*Status: We are currently moving from Phase 1 into Phase 2.*
