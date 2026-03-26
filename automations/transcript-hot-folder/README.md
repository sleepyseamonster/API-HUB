# Transcript Hot Folder Workflow

This folder contains the n8n workflow artifact for the transcript hot-folder ingestion path.

## Files
- `v2026-03-17_r2.json`: importable workflow draft for transcript webhook intake.

## Expected Runtime Shape
- Entry node: webhook
- One transcript file per execution
- Bulk uploads are handled by the local watcher in `backend/tools/transcript_hot_folder_watcher.py`
- Input field name for the uploaded file: `file`
- Extra form fields:
  - `batch_id`
  - `source_filename`
  - `source_relative_path`
  - `fingerprint`
  - `dropped_at`
  - `content_type`

## What You Must Configure After Import
- Attach your OpenAI credential to `Transcript Chunker`.
- Attach your Airtable credential to both Airtable nodes.
- Set the webhook path or copy the production webhook URL into `N8N_TRANSCRIPT_WEBHOOK_URL`.
- Configure `N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER` and `N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN` if the webhook is protected.
- Confirm the Airtable base and table IDs still point to `Transcript Knowledge`.
- Store watcher config in `backend/tools/transcript_hot_folder_watcher.env` or `Kirk's Folder/automation-bay/transcripts/.watcher.env` for durable local startup.

## Workflow Behavior
- Extract `.txt` and `.md` transcript text from the incoming binary file.
- Convert the transcript into structured knowledge chunks.
- Normalize `retrieval_tags` into a plain string for the current Airtable field type.
- Check Airtable for an existing chunk `id`.
- Create only missing chunk records.
- Return one JSON response summarizing generated versus inserted chunks.
- Emit a workflow version so batch results can be traced back to the export revision.
