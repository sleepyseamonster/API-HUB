# Backend Utilities

This folder currently contains local tooling for transcript ingestion.

## Transcript Hot Folder Watcher

The watcher posts one transcript file per execution to the n8n webhook and keeps local batch state under the transcript hot-folder root.

### Files
- `tools/transcript_hot_folder_watcher.py`: local batch watcher and webhook client.
- `tools/transcript_hot_folder_watcher.env.example`: sample environment for local execution.
- `tests/test_transcript_hot_folder_watcher.py`: unit tests for the watcher behavior.

### Runtime Contract
- Input files must be `.txt` or `.md`.
- Each file is sent as multipart form data with the binary field name `file`.
- Extra fields are `batch_id`, `source_filename`, `source_relative_path`, `fingerprint`, `dropped_at`, and `content_type`.
- The watcher expects the n8n webhook to return JSON with `status`, `message`, `chunks_generated`, and `chunks_inserted`.

### Local Run
```bash
python3 backend/tools/transcript_hot_folder_watcher.py watch
```

### Preflight
```bash
python3 backend/tools/transcript_hot_folder_watcher.py doctor
```
Use this after exporting the watcher environment to confirm the local folder layout and webhook settings before processing a batch.

### Environment
Copy `backend/tools/transcript_hot_folder_watcher.env.example` to a local shell profile or export the variables directly before starting the watcher.
