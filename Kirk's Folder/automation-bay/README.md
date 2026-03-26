# Automation Bay

This is Kirk's private local hot-folder surface for file-triggered automations.

## Purpose
- Drag transcript batches into a watched folder.
- Let a local watcher post one file at a time to n8n Cloud.
- Keep runtime state visible from Finder without needing to open n8n.

## Transcript Hot Folder v1

```text
automation-bay/
└── transcripts/
    ├── batches/
    ├── processing/
    ├── done/
    ├── failed/
    └── results/
```

Operating model:
- Drop one batch folder into `transcripts/batches/`.
- Or drop one or more `.txt` / `.md` transcripts directly into `transcripts/batches/` and the watcher will treat the current loose files there as one batch.
- Supported files in v1: `.txt`, `.md`.
- Nested folders inside a batch are supported and preserved in `processing/`, `done/`, `failed/`, and `results/`.
- One transcript file becomes one webhook request and one n8n execution.

## Watcher

Run the local watcher from the repo root:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py watch
```

Recommended config file:

```bash
cp backend/tools/transcript_hot_folder_watcher.env.example backend/tools/transcript_hot_folder_watcher.env
```

Required values inside that env file:

```bash
N8N_TRANSCRIPT_WEBHOOK_URL="https://<your-n8n-host>/webhook/transcript-hot-folder-intake"
```

Optional values inside that env file:

```bash
N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER="X-Hotfolder-Secret"
N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN="<secret>"
TRANSCRIPT_HOT_FOLDER_ROOT="/absolute/path/to/Kirk's Folder/automation-bay/transcripts"
TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL="5"
TRANSCRIPT_HOT_FOLDER_STABLE_SECONDS="4"
TRANSCRIPT_HOT_FOLDER_REQUEST_TIMEOUT="120"
```

Recommended run mode on macOS:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py start-launch-agent
```

Useful checks:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py doctor
python3 backend/tools/transcript_hot_folder_watcher.py status
```

For a one-time batch sweep instead of a long-running watcher:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py scan-once
```

Useful lifecycle commands:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py stop-launch-agent
python3 backend/tools/transcript_hot_folder_watcher.py uninstall-launch-agent
```

## Result Files
- Each processed transcript writes `<filename>.result.json` under `transcripts/results/<batch_id>/`.
- Each batch also writes `batch.result.json` with processed counts and unsupported files.
- Successful and skipped-duplicate files end in `done/`.
- Failures and unsupported files end in `failed/`.
- The watcher writes runtime logs to `transcripts/logs/`.
- The watcher writes health state to `transcripts/.watcher.state.json`.
