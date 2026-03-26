"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { CodeBlock } from "@/shared/ui/code-block";
import { Panel } from "@/shared/ui/panel";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { EndpointSpec, RequestState } from "@/shared/types/portal";

interface TranscriptIngestConsoleProps {
  endpoint: EndpointSpec;
}

interface TranscriptConsoleResult {
  statusCode: number;
  latencyMs: number;
  body: Record<string, unknown>;
}

export function TranscriptIngestConsole({ endpoint }: TranscriptIngestConsoleProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptConsoleResult | null>(null);

  const curlSnippet = useMemo(() => {
    return [
      "curl -X POST http://localhost:3000/v1/tools/transcript-ingest \\",
      '  -F "file=@/absolute/path/to/transcript.txt"',
    ].join("\n");
  }, []);

  async function runUpload() {
    setErrorText(null);

    if (!file) {
      setState("error");
      setResult(null);
      setErrorText("Choose a `.txt` or `.md` transcript file.");
      return;
    }

    setState("running");

    try {
      const formData = new FormData();
      formData.set("file", file, file.name);
      const startedAt = Date.now();
      const response = await fetch(endpoint.path, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const latencyMs = Date.now() - startedAt;
      const normalizedBody =
        body ??
        ({
          status: "error",
          data: {},
          message: response.ok ? "Request completed." : "Request failed.",
        } satisfies Record<string, unknown>);

      setResult({
        statusCode: response.status,
        latencyMs,
        body: normalizedBody,
      });
      setState(response.ok ? "success" : "error");
    } catch (error) {
      setResult(null);
      setState("error");
      setErrorText(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Transcript Upload</h3>
              <p className="mt-1 text-sm text-app-muted">
                Upload one `.txt` or `.md` transcript and this demo route will forward it to the
                live n8n intake webhook.
              </p>
            </div>
            <StatusBadge status={state} />
          </div>

          <div className="space-y-2">
            <label htmlFor="transcript-file" className="block text-sm text-app-muted">
              Transcript file
            </label>
            <input
              id="transcript-file"
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
              }}
              className="block w-full rounded-md border border-app-border bg-panel px-3 py-3 text-sm text-app-text file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-app-bg"
            />
          </div>

          <div className="rounded-md border border-app-border bg-app-bg px-3 py-3 text-sm text-app-muted">
            The public demo route accepts a single transcript file per request. For Finder-based
            bulk drops, keep using the local watcher.
          </div>

          {errorText ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorText}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runUpload()} data-testid="run-transcript-ingest">
              Upload Transcript
            </Button>
            <p className="text-xs text-app-muted">
              Route: <span className="font-mono text-app-text">{endpoint.path}</span>
            </p>
          </div>
        </Panel>

        <Panel className="space-y-3" data-testid="transcript-ingest-response">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Response</h3>
            {result ? (
              <p className="font-mono text-xs text-app-muted">
                {result.statusCode} • {result.latencyMs}ms
              </p>
            ) : null}
          </div>

          <CodeBlock
            label="JSON"
            code={
              result
                ? JSON.stringify(result.body, null, 2)
                : "Upload a transcript to inspect the live route response."
            }
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">cURL Demo</h3>
          <CodeBlock code={curlSnippet} />
        </Panel>

        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">Current File</h3>
          <CodeBlock
            label="JSON"
            code={
              file
                ? JSON.stringify(
                    {
                      name: file.name,
                      type: file.type || "application/octet-stream",
                      size_bytes: file.size,
                    },
                    null,
                    2,
                  )
                : "Choose a transcript file to inspect the upload payload."
            }
          />
        </Panel>
      </div>
    </div>
  );
}
