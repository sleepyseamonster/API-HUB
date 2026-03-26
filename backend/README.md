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

### Runtime Status
```bash
python3 backend/tools/transcript_hot_folder_watcher.py status
```
This reports whether a macOS launch agent is installed, whether a watcher lock is active, and the latest watcher state file if one exists.

### Recommended macOS Run Mode
Store the watcher config in `backend/tools/transcript_hot_folder_watcher.env` or `Kirk's Folder/automation-bay/transcripts/.watcher.env`, then run:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py start-launch-agent
```

Useful lifecycle commands:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py stop-launch-agent
python3 backend/tools/transcript_hot_folder_watcher.py uninstall-launch-agent
```

The launch agent writes logs to `Kirk's Folder/automation-bay/transcripts/logs/`.

### Environment
Copy `backend/tools/transcript_hot_folder_watcher.env.example` to `backend/tools/transcript_hot_folder_watcher.env` or `Kirk's Folder/automation-bay/transcripts/.watcher.env`.
Shell exports still work, but env-file startup is the durable path because it also works for the launch agent.
