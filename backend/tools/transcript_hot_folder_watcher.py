#!/usr/bin/env python3
"""Local watcher for transcript batch folders posted to n8n Cloud."""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import plistlib
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit, urlunsplit
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {
    ".txt": "text/plain",
    ".md": "text/markdown",
}

LAUNCH_AGENT_LABEL = "com.apihub.transcript-hot-folder-watcher"


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


def default_env_file_candidates() -> list[Path]:
    repo_root = Path(__file__).resolve().parents[2]
    return [
        repo_root / "backend" / "tools" / "transcript_hot_folder_watcher.env",
        repo_root / "Kirk's Folder" / "automation-bay" / "transcripts" / ".watcher.env",
    ]


@dataclass(slots=True)
class Config:
    root: Path
    webhook_url: str
    auth_header: str | None
    auth_token: str | None
    scan_interval: float
    stable_seconds: float
    request_timeout: float
    retry_attempts: int = 2
    retry_delay_seconds: float = 2.0
    env_file: Path | None = None

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

    @property
    def logs_dir(self) -> Path:
        return self.root / "logs"

    @property
    def lock_path(self) -> Path:
        return self.root / ".watcher.lock.json"

    @property
    def state_path(self) -> Path:
        return self.root / ".watcher.state.json"

    @property
    def launch_agent_path(self) -> Path:
        return Path.home() / "Library" / "LaunchAgents" / f"{LAUNCH_AGENT_LABEL}.plist"


def ensure_directories(config: Config) -> None:
    for path in (
        config.batches_dir,
        config.processing_dir,
        config.done_dir,
        config.failed_dir,
        config.results_dir,
        config.logs_dir,
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


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        raise FileNotFoundError(f"Env file not found: {path}")
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            raise ValueError(f"Invalid env line {index} in {path}: expected KEY=VALUE")
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError(f"Invalid env line {index} in {path}: missing key")
        if (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in {'"', "'"}
        ):
            value = value[1:-1]
        values[key] = value
    return values


def resolve_env_file(cli_path: str | None) -> Path | None:
    if cli_path:
        return Path(cli_path).expanduser()
    for candidate in default_env_file_candidates():
        if candidate.exists():
            return candidate
    return None


def prime_environment(env_file: Path | None) -> Path | None:
    if env_file is None:
        return None
    loaded = load_env_file(env_file)
    for key, value in loaded.items():
        os.environ.setdefault(key, value)
    return env_file.resolve()


def sanitize_url(value: str) -> str:
    parts = urlsplit(value)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def pid_is_running(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


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


def is_retryable_status(status_code: int) -> bool:
    return status_code in {408, 425, 429, 500, 502, 503, 504}


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
    last_error: Exception | None = None
    for attempt in range(config.retry_attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=config.request_timeout) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload) if payload else {}
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(
                f"Webhook returned HTTP {exc.code}: {error_body or exc.reason}"
            )
            if attempt < config.retry_attempts and is_retryable_status(exc.code):
                time.sleep(config.retry_delay_seconds * (attempt + 1))
                continue
            raise last_error from exc
        except urllib.error.URLError as exc:
            last_error = RuntimeError(f"Webhook request failed: {exc.reason}")
            if attempt < config.retry_attempts:
                time.sleep(config.retry_delay_seconds * (attempt + 1))
                continue
            raise last_error from exc
    if last_error is not None:
        raise last_error
    raise RuntimeError("Webhook request failed without a recorded error.")


def discover_batch_dirs(batches_dir: Path) -> list[Path]:
    return sorted(path for path in batches_dir.iterdir() if path.is_dir())


def discover_loose_batch_files(batches_dir: Path) -> list[Path]:
    return sorted(path for path in batches_dir.iterdir() if path.is_file())


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
        if response.get("workflow_version"):
            result["workflow_version"] = response["workflow_version"]
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


def build_loose_batch_id(batches_dir: Path) -> str:
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    return f"{slugify(batches_dir.name)}-drop-{timestamp}"


def wait_for_stable_loose_files(
    batches_dir: Path,
    stable_seconds: float,
    poll_interval: float,
) -> list[Path]:
    if stable_seconds <= 0:
        return discover_loose_batch_files(batches_dir)
    previous = {
        path.name: (path.stat().st_size, int(path.stat().st_mtime_ns))
        for path in discover_loose_batch_files(batches_dir)
        if not path.name.startswith(".")
    }
    stable_since = time.monotonic()
    while True:
        time.sleep(max(0.1, min(poll_interval, stable_seconds)))
        current = {
            path.name: (path.stat().st_size, int(path.stat().st_mtime_ns))
            for path in discover_loose_batch_files(batches_dir)
            if not path.name.startswith(".")
        }
        if current != previous:
            previous = current
            stable_since = time.monotonic()
            continue
        if time.monotonic() - stable_since >= stable_seconds:
            return [
                batches_dir / name
                for name in sorted(current)
                if (batches_dir / name).exists()
            ]


def process_loose_files_once(config: Config, source_files: list[Path]) -> dict[str, Any]:
    ensure_directories(config)
    batch_id = build_loose_batch_id(config.batches_dir)
    processing_root = config.processing_dir / batch_id
    done_root = config.done_dir / batch_id
    failed_root = config.failed_dir / batch_id
    results_root = config.results_dir / batch_id
    for path in (processing_root, done_root, failed_root, results_root):
        path.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    started_at = utc_now_iso()
    for source_file in source_files:
        if not source_file.exists():
            continue
        suffix = source_file.suffix.lower()
        if suffix not in SUPPORTED_EXTENSIONS:
            results.append(
                process_unsupported_file(
                    batch_dir=config.batches_dir,
                    batch_id=batch_id,
                    source_file=source_file,
                    failed_root=failed_root,
                    results_root=results_root,
                )
            )
            continue
        results.append(
            process_supported_file(
                config,
                batch_dir=config.batches_dir,
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
        "source_batch_folder": config.batches_dir.name,
        "started_at": started_at,
        "finished_at": utc_now_iso(),
        "workflow_version": next(
            (item.get("workflow_version") for item in results if item.get("workflow_version")),
            None,
        ),
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
    cleanup_empty_directories(processing_root)
    return summary


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
        "workflow_version": next(
            (item.get("workflow_version") for item in results if item.get("workflow_version")),
            None,
        ),
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
    requires_webhook = args.command not in {"status", "stop-launch-agent", "uninstall-launch-agent"}
    if requires_webhook and not webhook_url:
        raise SystemExit("Missing webhook URL. Set N8N_TRANSCRIPT_WEBHOOK_URL.")

    root = Path(
        args.root
        or os.environ.get("TRANSCRIPT_HOT_FOLDER_ROOT")
        or default_root()
    ).expanduser()
    return Config(
        root=root,
        webhook_url=webhook_url or "https://example.invalid/webhook/transcript-hot-folder-intake",
        auth_header=args.auth_header or os.environ.get("N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER"),
        auth_token=args.auth_token or os.environ.get("N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN"),
        scan_interval=float(
            args.scan_interval
            if args.scan_interval is not None
            else os.environ.get("TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL", "5")
        ),
        stable_seconds=float(
            args.stable_seconds
            if args.stable_seconds is not None
            else os.environ.get("TRANSCRIPT_HOT_FOLDER_STABLE_SECONDS", "4")
        ),
        request_timeout=float(
            args.request_timeout
            if args.request_timeout is not None
            else os.environ.get("TRANSCRIPT_HOT_FOLDER_REQUEST_TIMEOUT", "120")
        ),
        retry_attempts=int(
            args.retry_attempts
            if args.retry_attempts is not None
            else os.environ.get("TRANSCRIPT_HOT_FOLDER_RETRY_ATTEMPTS", "2")
        ),
        retry_delay_seconds=float(
            args.retry_delay_seconds
            if args.retry_delay_seconds is not None
            else os.environ.get("TRANSCRIPT_HOT_FOLDER_RETRY_DELAY_SECONDS", "2")
        ),
        env_file=resolve_env_file(args.env_file),
    )


class WatchLock:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.pid = os.getpid()
        self.acquired = False

    def acquire(self) -> None:
        ensure_directories(self.config)
        if self.config.lock_path.exists():
            existing = json.loads(self.config.lock_path.read_text(encoding="utf-8"))
            existing_pid = int(existing.get("pid", 0) or 0)
            if pid_is_running(existing_pid):
                raise RuntimeError(
                    f"Watcher already running with pid {existing_pid}. "
                    f"See {self.config.state_path} for runtime state."
                )
            self.config.lock_path.unlink(missing_ok=True)
        payload = {
            "pid": self.pid,
            "started_at": utc_now_iso(),
            "root": str(self.config.root),
            "env_file": str(self.config.env_file) if self.config.env_file else None,
        }
        temp_path = self.config.lock_path.with_suffix(".tmp")
        write_json(temp_path, payload)
        temp_path.replace(self.config.lock_path)
        self.acquired = True

    def release(self) -> None:
        if not self.acquired:
            return
        if self.config.lock_path.exists():
            try:
                existing = json.loads(self.config.lock_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = {}
            if int(existing.get("pid", 0) or 0) == self.pid:
                self.config.lock_path.unlink(missing_ok=True)
        self.acquired = False


class WatchState:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.started_at = utc_now_iso()

    def write(self, status: str, **extra: Any) -> dict[str, Any]:
        payload = {
            "status": status,
            "pid": os.getpid(),
            "root": str(self.config.root),
            "batches_dir": str(self.config.batches_dir),
            "webhook_url": sanitize_url(self.config.webhook_url),
            "env_file": str(self.config.env_file) if self.config.env_file else None,
            "updated_at": utc_now_iso(),
            "started_at": self.started_at,
        }
        payload.update(extra)
        write_json(self.config.state_path, payload)
        return payload


def launchctl_domain() -> str:
    if sys.platform != "darwin":
        raise RuntimeError("Launch agent management is only supported on macOS.")
    return f"gui/{os.getuid()}"


def launchctl_service_target() -> str:
    return f"{launchctl_domain()}/{LAUNCH_AGENT_LABEL}"


def run_launchctl(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["launchctl", *args],
        capture_output=True,
        text=True,
        check=check,
    )


def build_launch_agent_plist(config: Config, python_executable: str) -> bytes:
    ensure_directories(config)
    env_file = config.env_file or resolve_env_file(None)
    program_arguments = [
        python_executable,
        str(Path(__file__).resolve()),
        "watch",
    ]
    if env_file is not None:
        program_arguments.extend(["--env-file", str(env_file)])
    plist_payload = {
        "Label": LAUNCH_AGENT_LABEL,
        "ProgramArguments": program_arguments,
        "WorkingDirectory": str(Path(__file__).resolve().parents[2]),
        "RunAtLoad": True,
        "KeepAlive": True,
        "StandardOutPath": str(config.logs_dir / "watcher.stdout.log"),
        "StandardErrorPath": str(config.logs_dir / "watcher.stderr.log"),
        "ProcessType": "Background",
    }
    return plistlib.dumps(plist_payload, sort_keys=True)


def install_launch_agent(config: Config, python_executable: str) -> dict[str, Any]:
    config.launch_agent_path.parent.mkdir(parents=True, exist_ok=True)
    config.launch_agent_path.write_bytes(build_launch_agent_plist(config, python_executable))
    return {
        "status": "installed",
        "label": LAUNCH_AGENT_LABEL,
        "launch_agent_path": str(config.launch_agent_path),
        "logs_dir": str(config.logs_dir),
        "env_file": str(config.env_file) if config.env_file else None,
    }


def start_launch_agent(config: Config) -> dict[str, Any]:
    install_launch_agent(config, sys.executable)
    run_launchctl("bootout", launchctl_service_target(), check=False)
    run_launchctl("bootstrap", launchctl_domain(), str(config.launch_agent_path))
    run_launchctl("enable", launchctl_service_target(), check=False)
    run_launchctl("kickstart", "-k", launchctl_service_target())
    return {"status": "started", "label": LAUNCH_AGENT_LABEL}


def stop_launch_agent(config: Config) -> dict[str, Any]:
    result = run_launchctl("bootout", launchctl_service_target(), check=False)
    return {
        "status": "stopped" if result.returncode == 0 else "not_loaded",
        "label": LAUNCH_AGENT_LABEL,
        "stderr": result.stderr.strip(),
    }


def uninstall_launch_agent(config: Config) -> dict[str, Any]:
    stop_launch_agent(config)
    config.launch_agent_path.unlink(missing_ok=True)
    return {
        "status": "uninstalled",
        "label": LAUNCH_AGENT_LABEL,
        "launch_agent_path": str(config.launch_agent_path),
    }


def launch_agent_status(config: Config) -> dict[str, Any]:
    result = run_launchctl("print", launchctl_service_target(), check=False)
    report = {
        "label": LAUNCH_AGENT_LABEL,
        "launch_agent_path": str(config.launch_agent_path),
        "plist_exists": config.launch_agent_path.exists(),
        "loaded": result.returncode == 0,
        "state_file_exists": config.state_path.exists(),
        "lock_file_exists": config.lock_path.exists(),
    }
    if config.state_path.exists():
        report["runtime_state"] = json.loads(config.state_path.read_text(encoding="utf-8"))
    if config.lock_path.exists():
        lock_payload = json.loads(config.lock_path.read_text(encoding="utf-8"))
        pid = int(lock_payload.get("pid", 0) or 0)
        lock_payload["pid_running"] = pid_is_running(pid)
        report["lock"] = lock_payload
    if result.stdout.strip():
        report["launchctl"] = result.stdout.strip()
    if result.stderr.strip():
        report["launchctl_stderr"] = result.stderr.strip()
    return report


def doctor(config: Config) -> dict[str, Any]:
    ensure_directories(config)
    lock_payload = None
    if config.lock_path.exists():
        try:
            lock_payload = json.loads(config.lock_path.read_text(encoding="utf-8"))
            lock_payload["pid_running"] = pid_is_running(int(lock_payload.get("pid", 0) or 0))
        except json.JSONDecodeError:
            lock_payload = {"status": "invalid"}
    report = {
        "root": str(config.root),
        "batches_dir": str(config.batches_dir),
        "processing_dir": str(config.processing_dir),
        "done_dir": str(config.done_dir),
        "failed_dir": str(config.failed_dir),
        "results_dir": str(config.results_dir),
        "logs_dir": str(config.logs_dir),
        "webhook_url": sanitize_url(config.webhook_url),
        "auth_header_set": bool(config.auth_header),
        "auth_token_set": bool(config.auth_token),
        "env_file": str(config.env_file) if config.env_file else None,
        "scan_interval_seconds": config.scan_interval,
        "stable_seconds": config.stable_seconds,
        "request_timeout_seconds": config.request_timeout,
        "retry_attempts": config.retry_attempts,
        "retry_delay_seconds": config.retry_delay_seconds,
        "supported_extensions": sorted(SUPPORTED_EXTENSIONS),
        "lock": lock_payload,
        "launch_agent_path": str(config.launch_agent_path),
        "launch_agent_installed": config.launch_agent_path.exists(),
        "status": "ok",
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return report


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        choices=(
            "watch",
            "scan-once",
            "doctor",
            "status",
            "install-launch-agent",
            "start-launch-agent",
            "stop-launch-agent",
            "uninstall-launch-agent",
        ),
        help="Run continuously or process the current batch folders once.",
    )
    parser.add_argument("--env-file", help="Optional watcher env file to load before config.")
    parser.add_argument("--root", help="Override the transcript hot-folder root.")
    parser.add_argument("--webhook-url", help="n8n Cloud webhook URL.")
    parser.add_argument("--auth-header", help="Optional webhook auth header name.")
    parser.add_argument("--auth-token", help="Optional webhook auth token.")
    parser.add_argument(
        "--python-executable",
        default=sys.executable,
        help="Python executable to embed in the launch agent.",
    )
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
    parser.add_argument(
        "--retry-attempts",
        type=int,
        help="How many times to retry transient webhook failures.",
    )
    parser.add_argument(
        "--retry-delay-seconds",
        type=float,
        help="Base delay between webhook retry attempts.",
    )
    return parser.parse_args(argv)


def scan_once(config: Config) -> list[dict[str, Any]]:
    ensure_directories(config)
    summaries = []
    for batch_dir in discover_batch_dirs(config.batches_dir):
        print(f"[transcript-hot-folder] processing batch {batch_dir.name}", file=sys.stderr)
        summaries.append(process_batch_once(config, batch_dir))
    loose_files = [
        path
        for path in discover_loose_batch_files(config.batches_dir)
        if not path.name.startswith(".")
    ]
    if loose_files:
        loose_files = wait_for_stable_loose_files(
            config.batches_dir,
            config.stable_seconds,
            config.scan_interval,
        )
        print(
            f"[transcript-hot-folder] processing loose batch with {len(loose_files)} files",
            file=sys.stderr,
        )
        if loose_files:
            summaries.append(process_loose_files_once(config, loose_files))
    if not summaries:
        print("[transcript-hot-folder] no batches found", file=sys.stderr)
    return summaries


def watch(config: Config) -> int:
    ensure_directories(config)
    lock = WatchLock(config)
    state = WatchState(config)
    lock.acquire()
    state.write("starting")
    print(
        f"[transcript-hot-folder] watching {config.batches_dir}",
        file=sys.stderr,
    )
    try:
        state.write("watching", last_scan_at=None)
        while True:
            state.write("watching", last_scan_at=utc_now_iso())
            scan_once(config)
            time.sleep(max(1.0, config.scan_interval))
    except KeyboardInterrupt:
        state.write("stopped", reason="keyboard_interrupt")
        return 0
    except Exception as exc:
        state.write("error", error={"message": str(exc)})
        raise
    finally:
        lock.release()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    env_file = prime_environment(resolve_env_file(args.env_file))
    if env_file is not None:
        args.env_file = str(env_file)
    config = build_config(args)
    if args.command == "doctor":
        doctor(config)
        return 0
    if args.command == "status":
        print(json.dumps(launch_agent_status(config), indent=2, sort_keys=True))
        return 0
    if args.command == "install-launch-agent":
        print(
            json.dumps(
                install_launch_agent(config, args.python_executable),
                indent=2,
                sort_keys=True,
            )
        )
        return 0
    if args.command == "start-launch-agent":
        print(json.dumps(start_launch_agent(config), indent=2, sort_keys=True))
        return 0
    if args.command == "stop-launch-agent":
        print(json.dumps(stop_launch_agent(config), indent=2, sort_keys=True))
        return 0
    if args.command == "uninstall-launch-agent":
        print(json.dumps(uninstall_launch_agent(config), indent=2, sort_keys=True))
        return 0
    if args.command == "scan-once":
        scan_once(config)
        return 0
    return watch(config)


if __name__ == "__main__":
    raise SystemExit(main())
