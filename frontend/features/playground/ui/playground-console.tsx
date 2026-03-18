"use client";

import { useMemo, useState } from "react";
import { generateCodeSnippets } from "@/shared/lib/snippets";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Button } from "@/shared/ui/button";
import { CodeBlock } from "@/shared/ui/code-block";
import { Panel } from "@/shared/ui/panel";
import { StatusBadge } from "@/shared/ui/status-badge";
import type {
  CodeSnippet,
  EndpointSpec,
  PlaygroundMode,
  PlaygroundRunResult,
  RequestState,
} from "@/shared/types/portal";

interface PlaygroundConsoleProps {
  endpoint: EndpointSpec;
}

function parsePayload(raw: string): Record<string, unknown> {
  if (!raw.trim()) {
    return {};
  }

  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Payload must be a JSON object.");
  }
  return parsed;
}

export function PlaygroundConsole({ endpoint }: PlaygroundConsoleProps) {
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(endpoint.requestExample.payload, null, 2),
  );
  const [mode, setMode] = useState<PlaygroundMode>("success");
  const [result, setResult] = useState<PlaygroundRunResult | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [snippetLanguage, setSnippetLanguage] = useState<CodeSnippet["language"]>("curl");

  const snippets = useMemo(
    () =>
      generateCodeSnippets({
        endpoint,
        payload: endpoint.requestExample.payload,
      }),
    [endpoint],
  );

  const selectedSnippet = snippets.find((item) => item.language === snippetLanguage) ?? snippets[0];

  async function runSimulation() {
    setErrorText(null);
    setState("running");

    try {
      const payload = parsePayload(payloadText);
      const simulation = await portalDataProvider.runPlayground({
        slug: endpoint.slug,
        payload,
        mode,
      });
      setResult(simulation);
      setState(simulation.status === "success" ? "success" : "error");
    } catch (error) {
      setResult(null);
      setState("error");
      setErrorText(error instanceof Error ? error.message : "Invalid payload");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Request Builder</h3>
          <StatusBadge status={state} />
        </div>

        <div className="space-y-2">
          <label htmlFor="sim-mode" className="block text-sm text-app-muted">
            Simulation mode
          </label>
          <select
            id="sim-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as PlaygroundMode)}
            className="h-10 w-full rounded-md border border-app-border bg-panel px-3 text-sm outline-none focus-visible:border-accent"
          >
            <option value="success">Force success</option>
            <option value="error">Force error</option>
            <option value="random">Randomized</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="request-payload" className="block text-sm text-app-muted">
            JSON payload
          </label>
          <textarea
            id="request-payload"
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void runSimulation();
              }
            }}
            className="h-72 w-full rounded-md border border-app-border bg-app-bg p-3 font-mono text-xs text-app-text outline-none focus-visible:border-accent"
            spellCheck={false}
          />
        </div>

        {errorText ? <p className="text-sm text-red-300">{errorText}</p> : null}

        <Button onClick={runSimulation} className="w-full sm:w-auto" data-testid="run-playground">
          Run Test (Cmd + Enter)
        </Button>
      </Panel>

      <div className="space-y-4">
        <Panel className="space-y-3" data-testid="playground-response">
          <div className="flex items-center justify-between">
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
                : "Run the playground to view a simulated response."
            }
          />
        </Panel>

        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Code Snippets</h3>
            <select
              value={snippetLanguage}
              onChange={(event) =>
                setSnippetLanguage(event.target.value as CodeSnippet["language"])
              }
              className="h-9 rounded-md border border-app-border bg-panel px-2 text-xs outline-none focus-visible:border-accent"
            >
              <option value="curl">cURL</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="ruby">Ruby</option>
            </select>
          </div>
          <CodeBlock code={selectedSnippet.content} />
        </Panel>
      </div>
    </div>
  );
}
