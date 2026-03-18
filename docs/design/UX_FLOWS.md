# UX Flows & Screen Architecture

This document defines the user experience, core screens, and interaction patterns for the API HUB.

## 1. User Mindset & Philosophy
The user enters the hub with a "Toolbox" mental model. They are looking for a capability, not a social feed. 
- **Identify**: "What automations can I use?"
- **Understand**: "What data do I send, and what do I get back?"
- **Verify**: "Let me test it right now in the console."
- **Integrate**: "Give me the code snippet and my API key."

## 2. Core Screen Architecture

### A. Dashboard (The Overview)
- **Goal**: "Is everything working?"
- **Elements**: 
  - Summary metrics (Total calls, Success rate, Credits remaining).
  - High-level usage graph.
  - Recent activity feed (Real-time logs snippet).

### B. Automations Library (The Catalog)
- **Goal**: Discoverability.
- **Layout**: Grid of cards categorized by tool type (e.g., AI Tools, Data Tools).
- **Card Elements**: Name, short description, POST/GET method, "Test" button.

### C. Automation Detail Page (The Console)
- **Goal**: In-depth testing and integration.
- **Structure**: 
  - **Left/Main**: Request builder (JSON editor) + Documentation.
  - **Right/Bottom**: Real-time response window.
- **Features**: Toggle between Docs/Playground, Copy-to-Clipboard snippets (cURL, Python, JS).

### D. API Keys & Security
- **Goal**: Access control.
- **Features**: Key generation, Revocation, Sandbox vs. Production toggles, usage limits.

### E. Execution Logs (The Truth)
- **Goal**: Debugging and trust.
- **Layout**: Table view with Status, Endpoint, Duration, and Timestamp.
- **Interaction**: Click a row to see the full Request/Response header and body.

## 3. Interaction Patterns
- **Command Palette**: `Cmd + K` to jump between automations or pages instantly.
- **Progressive Disclosure**: Hide advanced API parameters under a "Show Advanced" toggle.
- **Frictionless Testing**: No setup required to test—users can use a default sandbox key in the playground.
- **Speed-First**: Keyboard shortcuts for "Run" (`Cmd + Enter`) and "Copy" actions.

## 4. Context Engineering (Prompting Strategy)
When asking design-related questions, use the following framework to get high-quality results:
1. **Define Task**: (e.g., "Design the Logs detail modal")
2. **Context Layer**: (e.g., "The user is debugging a failed multi-step n8n workflow")
3. **Visual Constraint**: (e.g., "Maintain the mechanical/industrial vibe, using monospaced fonts for headers")
4. **Key Outcome**: (e.g., "Highlight exactly where the data failed in the JSON output")
