#!/usr/bin/env python3
"""Local watcher for transcript batch folders posted to n8n Cloud."""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {
    ".txt": "text/plain",
    ".md": "text/markdown",
}


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "batch"


def default_root() -> Path:
    return (
        Path(__file__).resolve().parents[2]
        / "Kirk's Folder"
        / "automation-bay"
        / "transcripts"
    )


@dataclass(slots=True)
class Config:
    root: Path
    webhook_url: str
    auth_header: str | None
    auth_token: str | None
    scan_interval: float
    stable_seconds: float
    request_timeout: float

    @property
    def batches_dir(self) -> Path:
        return self.root / "batches"

    @property
    def processing_dir(self) -> Path:
        return self.root / "processing"

    @property
    def done_dir(self) -> Path:
        return self.root / "done"

    @property
    def failed_dir(self) -> Path:
        return self.root / "failed"

    @property
    def results_dir(self) -> Path:
        return self.root / "results"


def ensure_directories(config: Config) -> None:
    for path in (
        config.batches_dir,
        config.processing_dir,
        config.done_dir,
        config.failed_dir,
        config.results_dir,
    ):
        path.mkdir(parents=True, exist_ok=True)


def path_snapshot(root: Path) -> dict[str, tuple[int, int]]:
    snapshot: dict[str, tuple[int, int]] = {}
    if not root.exists():
        return snapshot
    for file_path in sorted(path for path in root.rglob("*") if path.is_file()):
        stat = file_path.stat()
        snapshot[str(file_path.relative_to(root))] = (stat.st_size, int(stat.st_mtime_ns))
    return snapshot


def wait_for_stable_tree(root: Path, stable_seconds: float, poll_interval: float) -> None:
    if stable_seconds <= 0:
        return
    previous = path_snapshot(root)
    stable_since = time.monotonic()
    while True:
        time.sleep(max(0.1, min(poll_interval, stable_seconds)))
        current = path_snapshot(root)
        if current != previous:
            previous = current
            stable_since = time.monotonic()
            continue
        if time.monotonic() - stable_since >= stable_seconds:
            return


def normalize_text_bytes(raw_bytes: bytes) -> bytes:
    text = raw_bytes.decode("utf-8", errors="replace")
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    return normalized.encode("utf-8")


def compute_fingerprint(file_path: Path) -> str:
    raw_bytes = file_path.read_bytes()
    payload = file_path.name.encode("utf-8") + b"\0" + normalize_text_bytes(raw_bytes)
    return hashlib.sha256(payload).hexdigest()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def guess_content_type(path: Path) -> str:
    explicit = SUPPORTED_EXTENSIONS.get(path.suffix.lower())
    if explicit:
        return explicit
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def build_multipart_request(
    fields: dict[str, str],
    file_field_name: str,
    file_path: Path,
) -> tuple[bytes, str]:
    boundary = f"----TranscriptHotFolder{int(time.time() * 1000)}"
    crlf = b"\r\n"
    body = bytearray()

    for key, value in fields.items():
        body.extend(f"--{boundary}".encode("utf-8"))
        body.extend(crlf)
        body.extend(
            f'Content-Disposition: form-data; name="{key}"'.encode("utf-8")
        )
        body.extend(crlf)
        body.extend(crlf)
        body.extend(value.encode("utf-8"))
        body.extend(crlf)

    content_type = guess_content_type(file_path)
    body.extend(f"--{boundary}".encode("utf-8"))
    body.extend(crlf)
    disposition = (
        f'Content-Disposition: form-data; name="{file_field_name}"; '
        f'filename="{file_path.name}"'
    )
    body.extend(disposition.encode("utf-8"))
    body.extend(crlf)
    body.extend(f"Content-Type: {content_type}".encode("utf-8"))
    body.extend(crlf)
    body.extend(crlf)
    body.extend(file_path.read_bytes())
    body.extend(crlf)
    body.extend(f"--{boundary}--".encode("utf-8"))
    body.extend(crlf)
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def send_to_webhook(
    config: Config,
    file_path: Path,
    *,
    batch_id: str,
    source_filename: str,
    source_relative_path: str,
    fingerprint: str,
    dropped_at: str,
) -> dict[str, Any]:
    fields = {
        "batch_id": batch_id,
        "source_filename": source_filename,
        "source_relative_path": source_relative_path,
        "fingerprint": fingerprint,
        "dropped_at": dropped_at,
        "content_type": guess_content_type(file_path),
    }
    body, content_type = build_multipart_request(fields, "file", file_path)
    headers = {
        "Content-Type": content_type,
        "Accept": "application/json",
    }
    if config.auth_header and config.auth_token:
        headers[config.auth_header] = config.auth_token
    request = urllib.request.Request(
        config.webhook_url,
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=config.request_timeout) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Webhook returned HTTP {exc.code}: {error_body or exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Webhook request failed: {exc.reason}") from exc


def discover_batch_dirs(batches_dir: Path) -> list[Path]:
    return sorted(path for path in batches_dir.iterdir() if path.is_dir())


def move_file_preserving_relative_path(
    *,
    file_path: Path,
    source_root: Path,
    destination_root: Path,
) -> Path:
    relative_path = file_path.relative_to(source_root)
    destination = destination_root / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(file_path), str(destination))
    return destination


def classify_batch_files(batch_dir: Path) -> tuple[list[Path], list[Path]]:
    supported: list[Path] = []
    unsupported: list[Path] = []
    for path in sorted(batch_dir.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() in SUPPORTED_EXTENSIONS:
            supported.append(path)
        else:
            unsupported.append(path)
    return supported, unsupported


def result_path_for(results_root: Path, relative_path: Path) -> Path:
    return (results_root / relative_path).with_name(relative_path.name + ".result.json")


def cleanup_empty_directories(root: Path) -> None:
    if not root.exists():
        return
    for path in sorted((p for p in root.rglob("*") if p.is_dir()), reverse=True):
        try:
            path.rmdir()
        except OSError:
            continue
    try:
        root.rmdir()
    except OSError:
        pass


def process_supported_file(
    config: Config,
    *,
    batch_dir: Path,
    batch_id: str,
    source_file: Path,
    processing_root: Path,
    done_root: Path,
    failed_root: Path,
    results_root: Path,
) -> dict[str, Any]:
    relative_path = source_file.relative_to(batch_dir)
    started_at = utc_now_iso()
    fingerprint = compute_fingerprint(source_file)
    processing_file = move_file_preserving_relative_path(
        file_path=source_file,
        source_root=batch_dir,
        destination_root=processing_root,
    )
    result: dict[str, Any] = {
        "batch_id": batch_id,
        "source_filename": source_file.name,
        "source_relative_path": relative_path.as_posix(),
        "fingerprint": fingerprint,
        "started_at": started_at,
        "status": "error",
        "message": "File processing did not complete.",
        "chunks_generated": 0,
        "chunks_inserted": 0,
    }

    try:
        response = send_to_webhook(
            config,
            processing_file,
            batch_id=batch_id,
            source_filename=source_file.name,
            source_relative_path=relative_path.as_posix(),
            fingerprint=fingerprint,
            dropped_at=started_at,
        )
        result.update(
            {
                "status": response.get("status", "success"),
                "message": response.get("message", "Processing completed."),
                "chunks_generated": int(response.get("chunks_generated", 0) or 0),
                "chunks_inserted": int(response.get("chunks_inserted", 0) or 0),
            }
        )
        if "duplicate_reason" in response:
            result["duplicate_reason"] = response["duplicate_reason"]
        if "airtable_record_ids" in response:
            result["airtable_record_ids"] = response["airtable_record_ids"]
    except Exception as exc:
        result["error"] = {"message": str(exc)}
        result["message"] = "Webhook processing failed."
        result["status"] = "error"

    final_root = done_root if result["status"] in {"success", "skipped_duplicate"} else failed_root
    final_file = move_file_preserving_relative_path(
        file_path=processing_file,
        source_root=processing_root,
        destination_root=final_root,
    )
    result["finished_at"] = utc_now_iso()
    result["final_path"] = final_file.as_posix()
    result_path = result_path_for(results_root, relative_path)
    write_json(result_path, result)
    return result


def process_unsupported_file(
    *,
    batch_dir: Path,
    batch_id: str,
    source_file: Path,
    failed_root: Path,
    results_root: Path,
) -> dict[str, Any]:
    relative_path = source_file.relative_to(batch_dir)
    failed_file = move_file_preserving_relative_path(
        file_path=source_file,
        source_root=batch_dir,
        destination_root=failed_root,
    )
    result = {
        "batch_id": batch_id,
        "source_filename": source_file.name,
        "source_relative_path": relative_path.as_posix(),
        "status": "unsupported_file",
        "message": "Unsupported file type. v1 only accepts .txt and .md transcripts.",
        "started_at": utc_now_iso(),
        "finished_at": utc_now_iso(),
        "chunks_generated": 0,
        "chunks_inserted": 0,
        "final_path": failed_file.as_posix(),
    }
    write_json(result_path_for(results_root, relative_path), result)
    return result


def build_batch_id(batch_dir: Path) -> str:
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    return f"{slugify(batch_dir.name)}-{timestamp}"


def process_batch_once(config: Config, batch_dir: Path) -> dict[str, Any]:
    ensure_directories(config)
    wait_for_stable_tree(batch_dir, config.stable_seconds, config.scan_interval)

    batch_id = build_batch_id(batch_dir)
    processing_root = config.processing_dir / batch_id
    done_root = config.done_dir / batch_id
    failed_root = config.failed_dir / batch_id
    results_root = config.results_dir / batch_id
    for path in (processing_root, done_root, failed_root, results_root):
        path.mkdir(parents=True, exist_ok=True)

    supported_files, unsupported_files = classify_batch_files(batch_dir)
    results: list[dict[str, Any]] = []

    for source_file in unsupported_files:
        if source_file.exists():
            results.append(
                process_unsupported_file(
                    batch_dir=batch_dir,
                    batch_id=batch_id,
                    source_file=source_file,
                    failed_root=failed_root,
                    results_root=results_root,
                )
            )

    for source_file in supported_files:
        if source_file.exists():
            results.append(
                process_supported_file(
                    config,
                    batch_dir=batch_dir,
                    batch_id=batch_id,
                    source_file=source_file,
                    processing_root=processing_root,
                    done_root=done_root,
                    failed_root=failed_root,
                    results_root=results_root,
                )
            )

    summary = {
        "batch_id": batch_id,
        "source_batch_folder": batch_dir.name,
        "started_at": results[0]["started_at"] if results else utc_now_iso(),
        "finished_at": utc_now_iso(),
        "processed_files": len([item for item in results if item["status"] != "unsupported_file"]),
        "successful_files": len(
            [item for item in results if item["status"] in {"success", "skipped_duplicate"}]
        ),
        "failed_files": len([item for item in results if item["status"] == "error"]),
        "unsupported_files": [
            item["source_relative_path"]
            for item in results
            if item["status"] == "unsupported_file"
        ],
        "results": [
            {
                "source_relative_path": item["source_relative_path"],
                "status": item["status"],
                "message": item["message"],
            }
            for item in results
        ],
    }
    write_json(results_root / "batch.result.json", summary)
    cleanup_empty_directories(batch_dir)
    cleanup_empty_directories(processing_root)
    return summary


def build_config(args: argparse.Namespace) -> Config:
    webhook_url = args.webhook_url or os.environ.get("N8N_TRANSCRIPT_WEBHOOK_URL")
    if not webhook_url:
        raise SystemExit("Missing webhook URL. Set N8N_TRANSCRIPT_WEBHOOK_URL.")

    root = Path(
        args.root
        or os.environ.get("TRANSCRIPT_HOT_FOLDER_ROOT")
        or default_root()
    ).expanduser()
    return Config(
        root=root,
        webhook_url=webhook_url,
        auth_header=args.auth_header or os.environ.get("N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER"),
        auth_token=args.auth_token or os.environ.get("N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN"),
        scan_interval=float(
            args.scan_interval
            or os.environ.get("TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL", "5")
        ),
        stable_seconds=float(
            args.stable_seconds
            or os.environ.get("TRANSCRIPT_HOT_FOLDER_STABLE_SECONDS", "4")
        ),
        request_timeout=float(
            args.request_timeout
            or os.environ.get("TRANSCRIPT_HOT_FOLDER_REQUEST_TIMEOUT", "120")
        ),
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        choices=("watch", "scan-once"),
        help="Run continuously or process the current batch folders once.",
    )
    parser.add_argument("--root", help="Override the transcript hot-folder root.")
    parser.add_argument("--webhook-url", help="n8n Cloud webhook URL.")
    parser.add_argument("--auth-header", help="Optional webhook auth header name.")
    parser.add_argument("--auth-token", help="Optional webhook auth token.")
    parser.add_argument("--scan-interval", type=float, help="Polling interval in seconds.")
    parser.add_argument(
        "--stable-seconds",
        type=float,
        help="How long the batch tree must remain unchanged before processing starts.",
    )
    parser.add_argument(
        "--request-timeout",
        type=float,
        help="Webhook request timeout in seconds.",
    )
    return parser.parse_args(argv)


def scan_once(config: Config) -> list[dict[str, Any]]:
    ensure_directories(config)
    summaries = []
    for batch_dir in discover_batch_dirs(config.batches_dir):
        print(f"[transcript-hot-folder] processing batch {batch_dir.name}", file=sys.stderr)
        summaries.append(process_batch_once(config, batch_dir))
    if not summaries:
        print("[transcript-hot-folder] no batches found", file=sys.stderr)
    return summaries


def watch(config: Config) -> int:
    ensure_directories(config)
    print(
        f"[transcript-hot-folder] watching {config.batches_dir}",
        file=sys.stderr,
    )
    while True:
        scan_once(config)
        time.sleep(max(1.0, config.scan_interval))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    config = build_config(args)
    if args.command == "scan-once":
        scan_once(config)
        return 0
    return watch(config)


if __name__ == "__main__":
    raise SystemExit(main())
