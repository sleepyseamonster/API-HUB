# Transcript Alchemist Skill

## Purpose
This skill is designed to take raw, messy transcripts (from Zoom, Riverside, or Vibe-Coding sessions) and transform them into structured, high-value data for the API Hub's `GET /v1/transcripts` endpoint.

## Instructions
1.  **Format Cleaning**: Remove filler words (um, ah, like), timestamps, and speaker labels unless they are critical for context.
2.  **Asset Identification**: Extract any mentioned URLs, code snippets, or book/tool references into a specialized `assets` metadata array.
3.  **Aha! Extraction**: Identify key pedagogical insights or "Pro-Tips" and wrap them in a `highlights` section.
4.  **Markdown Structure**: Use clean H1/H2/H3 headers for logical sectioning.
5.  **Output Format**: 
    ```json
    {
      "session_title": "",
      "date": "",
      "content": "Full markdown content...",
      "metadata": {
        "highlights": [],
        "links": [],
        "tags": []
      }
    }
    ```

## Usage
Activate this skill when the user provides a new transcript file or when building the `transcripts` database table logic.
