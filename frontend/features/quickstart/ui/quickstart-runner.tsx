"use client";

import { useState } from "react";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Button } from "@/shared/ui/button";
import { CodeBlock } from "@/shared/ui/code-block";
import { Panel } from "@/shared/ui/panel";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { RequestState } from "@/shared/types/portal";

export function QuickstartRunner() {
  const [state, setState] = useState<RequestState>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [body, setBody] = useState<Record<string, unknown> | null>(null);

  async function runQuickstart() {
    setState("running");

    const result = await portalDataProvider.runPlayground({
      slug: "knowledge-base-search",
      payload: {
        query: "How do I position my offer?",
        limit: 3,
      },
      mode: "success",
    });

    setBody(result.body);
    setLatency(result.latencyMs);
    setStatusCode(result.statusCode);
    setState(result.status === "success" ? "success" : "error");
  }

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quick Test Call</h3>
        <StatusBadge status={state} />
      </div>

      <p className="text-sm text-app-muted">
        Runs a mock call against `GET /v1/knowledge-base/search` with a sandbox payload.
      </p>

      <Button onClick={runQuickstart} data-testid="quickstart-run">
        Run First API Call
      </Button>

      {latency && statusCode ? (
        <p className="font-mono text-xs text-app-muted">
          Status: {statusCode} • Latency: {latency}ms
        </p>
      ) : null}

      <CodeBlock
        label="Response"
        code={body ? JSON.stringify(body, null, 2) : "Run the request to see a 200 response."}
      />
    </Panel>
  );
}
