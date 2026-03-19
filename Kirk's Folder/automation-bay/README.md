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
- Supported files in v1: `.txt`, `.md`.
- Nested folders inside a batch are supported and preserved in `processing/`, `done/`, `failed/`, and `results/`.
- One transcript file becomes one webhook request and one n8n execution.

## Watcher

Run the local watcher from the repo root:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py watch
```

Required environment:

```bash
export N8N_TRANSCRIPT_WEBHOOK_URL="https://<your-n8n-host>/webhook/transcript-hot-folder-intake"
```

Optional environment:

```bash
export N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER="X-Hotfolder-Secret"
export N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN="<secret>"
export TRANSCRIPT_HOT_FOLDER_ROOT="/absolute/path/to/Kirk's Folder/automation-bay/transcripts"
export TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL="5"
export TRANSCRIPT_HOT_FOLDER_STABLE_SECONDS="4"
export TRANSCRIPT_HOT_FOLDER_REQUEST_TIMEOUT="120"
```

For a one-time batch sweep instead of a long-running watcher:

```bash
python3 backend/tools/transcript_hot_folder_watcher.py scan-once
```

## Result Files
- Each processed transcript writes `<filename>.result.json` under `transcripts/results/<batch_id>/`.
- Each batch also writes `batch.result.json` with processed counts and unsupported files.
- Successful and skipped-duplicate files end in `done/`.
- Failures and unsupported files end in `failed/`.
