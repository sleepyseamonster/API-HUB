from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from backend.tools.transcript_hot_folder_watcher import (
    Config,
    build_launch_agent_plist,
    compute_fingerprint,
    ensure_directories,
    doctor,
    load_env_file,
    process_batch_once,
)


class _WebhookHandler(BaseHTTPRequestHandler):
    response_code = 200
    response_code_sequence: list[int] = []
    request_count = 0
    response_payload = {
        "status": "success",
        "message": "Transcript processed",
        "chunks_generated": 3,
        "chunks_inserted": 2,
        "airtable_record_ids": ["recA", "recB"],
    }

    def do_POST(self) -> None:  # noqa: N802
        content_length = int(self.headers.get("Content-Length", "0"))
        self.server.last_request_body = self.rfile.read(content_length)
        cls = self.__class__
        if cls.response_code_sequence:
            index = min(cls.request_count, len(cls.response_code_sequence) - 1)
            response_code = cls.response_code_sequence[index]
        else:
            response_code = cls.response_code
        cls.request_count += 1
        self.send_response(response_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(self.response_payload).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


class TranscriptHotFolderWatcherTests(TestCase):
    def test_fingerprint_normalizes_line_endings_and_uses_filename(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            file_a = root / "lesson.txt"
            file_b = root / "lesson-copy.txt"
            file_a.write_bytes(b"hello\r\nworld\r\n")
            file_b.write_bytes(b"hello\nworld\n")

            self.assertNotEqual(compute_fingerprint(file_a), compute_fingerprint(file_b))

            file_b = root / "lesson.txt"
            file_b.write_bytes(b"hello\nworld\n")
            self.assertEqual(compute_fingerprint(file_a), compute_fingerprint(file_b))

    def test_process_batch_once_moves_success_and_unsupported_files(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            server, thread, base_url = self._start_server()
            try:
                root = Path(tmp_dir) / "transcripts"
                config = Config(
                    root=root,
                    webhook_url=f"{base_url}/webhook/transcript-hot-folder-intake",
                    auth_header=None,
                    auth_token=None,
                    scan_interval=0.01,
                    stable_seconds=0,
                    request_timeout=5,
                )
                ensure_directories(config)
                batch_dir = config.batches_dir / "week-01"
                nested_dir = batch_dir / "module-a"
                nested_dir.mkdir(parents=True)
                (nested_dir / "lesson.md").write_text("# Test\nHello\n", encoding="utf-8")
                (batch_dir / "ignore.pdf").write_bytes(b"%PDF-1.4")

                summary = process_batch_once(config, batch_dir)

                self.assertEqual(summary["processed_files"], 1)
                self.assertEqual(summary["unsupported_files"], ["ignore.pdf"])

                done_batch = next(config.done_dir.iterdir())
                failed_batch = next(config.failed_dir.iterdir())
                self.assertTrue((done_batch / "module-a" / "lesson.md").exists())
                self.assertTrue((failed_batch / "ignore.pdf").exists())

                result_batch = next(config.results_dir.iterdir())
                lesson_result = result_batch / "module-a" / "lesson.md.result.json"
                self.assertTrue(lesson_result.exists())
                payload = json.loads(lesson_result.read_text(encoding="utf-8"))
                self.assertEqual(payload["status"], "success")
                self.assertEqual(payload["chunks_inserted"], 2)
            finally:
                server.shutdown()
                thread.join()
                server.server_close()

    def test_process_batch_once_marks_webhook_failures(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            _WebhookHandler.response_code = 500
            _WebhookHandler.response_payload = {"message": "boom"}
            server, thread, base_url = self._start_server()
            try:
                root = Path(tmp_dir) / "transcripts"
                config = Config(
                    root=root,
                    webhook_url=f"{base_url}/webhook/transcript-hot-folder-intake",
                    auth_header=None,
                    auth_token=None,
                    scan_interval=0.01,
                    stable_seconds=0,
                    request_timeout=5,
                )
                ensure_directories(config)
                batch_dir = config.batches_dir / "week-02"
                batch_dir.mkdir(parents=True)
                (batch_dir / "lesson.txt").write_text("Hello world\n", encoding="utf-8")

                summary = process_batch_once(config, batch_dir)

                self.assertEqual(summary["failed_files"], 1)
                failed_batch = next(config.failed_dir.iterdir())
                self.assertTrue((failed_batch / "lesson.txt").exists())
            finally:
                server.shutdown()
                thread.join()
                server.server_close()
                _WebhookHandler.response_code = 200
                _WebhookHandler.response_code_sequence = []
                _WebhookHandler.request_count = 0
                _WebhookHandler.response_payload = {
                    "status": "success",
                    "message": "Transcript processed",
                    "chunks_generated": 3,
                    "chunks_inserted": 2,
                    "airtable_record_ids": ["recA", "recB"],
                }

    def test_process_batch_once_retries_transient_webhook_failures(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            _WebhookHandler.response_code_sequence = [503, 200]
            _WebhookHandler.request_count = 0
            server, thread, base_url = self._start_server()
            try:
                root = Path(tmp_dir) / "transcripts"
                config = Config(
                    root=root,
                    webhook_url=f"{base_url}/webhook/transcript-hot-folder-intake",
                    auth_header=None,
                    auth_token=None,
                    scan_interval=0.01,
                    stable_seconds=0,
                    request_timeout=5,
                    retry_attempts=2,
                    retry_delay_seconds=0,
                )
                ensure_directories(config)
                batch_dir = config.batches_dir / "week-03"
                batch_dir.mkdir(parents=True)
                (batch_dir / "lesson.txt").write_text("Hello world\n", encoding="utf-8")

                summary = process_batch_once(config, batch_dir)

                self.assertEqual(summary["successful_files"], 1)
                self.assertEqual(_WebhookHandler.request_count, 2)
                done_batch = next(config.done_dir.iterdir())
                self.assertTrue((done_batch / "lesson.txt").exists())
            finally:
                server.shutdown()
                thread.join()
                server.server_close()
                _WebhookHandler.response_code_sequence = []
                _WebhookHandler.request_count = 0

    def test_doctor_reports_sanitized_config(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir) / "transcripts"
            config = Config(
                root=root,
                webhook_url="https://example.com/webhook/transcript-hot-folder-intake?token=secret",
                auth_header="X-Internal-Webhook-Secret",
                auth_token="super-secret",
                scan_interval=5,
                stable_seconds=4,
                request_timeout=120,
            )
            report = doctor(config)

            self.assertEqual(report["status"], "ok")
            self.assertEqual(report["webhook_url"], "https://example.com/webhook/transcript-hot-folder-intake")
            self.assertTrue(report["auth_header_set"])
            self.assertTrue(report["auth_token_set"])
            self.assertTrue(root.exists())
            self.assertTrue((root / "batches").exists())
            self.assertTrue((root / "results").exists())

    def test_load_env_file_parses_comments_and_quotes(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            env_path = Path(tmp_dir) / ".watcher.env"
            env_path.write_text(
                "\n".join(
                    [
                        "# comment",
                        'N8N_TRANSCRIPT_WEBHOOK_URL="https://example.com/webhook"',
                        "TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL=3",
                        "",
                    ]
                ),
                encoding="utf-8",
            )

            values = load_env_file(env_path)

            self.assertEqual(
                values["N8N_TRANSCRIPT_WEBHOOK_URL"],
                "https://example.com/webhook",
            )
            self.assertEqual(values["TRANSCRIPT_HOT_FOLDER_SCAN_INTERVAL"], "3")

    def test_build_launch_agent_plist_uses_env_file_and_logs(self) -> None:
        with TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir) / "transcripts"
            env_path = Path(tmp_dir) / ".watcher.env"
            env_path.write_text(
                "N8N_TRANSCRIPT_WEBHOOK_URL=https://example.com/webhook\n",
                encoding="utf-8",
            )
            config = Config(
                root=root,
                webhook_url="https://example.com/webhook/transcript-hot-folder-intake",
                auth_header=None,
                auth_token=None,
                scan_interval=5,
                stable_seconds=4,
                request_timeout=120,
                env_file=env_path,
            )

            payload = build_launch_agent_plist(config, "/usr/bin/python3")

            self.assertIn(b"com.apihub.transcript-hot-folder-watcher", payload)
            self.assertIn(str(env_path).encode("utf-8"), payload)
            self.assertIn(str(root / "logs").encode("utf-8"), payload)

    def _start_server(self) -> tuple[HTTPServer, threading.Thread, str]:
        server = HTTPServer(("127.0.0.1", 0), _WebhookHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        host, port = server.server_address
        return server, thread, f"http://{host}:{port}"
