"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Button } from "@/shared/ui/button";
import { CodeBlock } from "@/shared/ui/code-block";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import type {
  RequestState,
  StudioGenerationRecord,
  StudioGenerationStatus,
} from "@/shared/types/portal";

interface StudioRunState {
  recordId: string;
  prompt: string;
  refinedPrompt: string | null;
  imageUrl: string | null;
  status: StudioGenerationStatus;
}

function getBadgeState(status: StudioGenerationStatus | null, hasError: boolean): RequestState {
  if (hasError || status === "error") {
    return "error";
  }

  if (status === "complete") {
    return "success";
  }

  if (status === "queued" || status === "refining" || status === "generating") {
    return "running";
  }

  return "idle";
}

function toRunState(record: StudioGenerationRecord): StudioRunState {
  return {
    recordId: record.recordId,
    prompt: record.prompt,
    refinedPrompt: record.refinedPrompt,
    imageUrl: record.imageUrl,
    status: record.status,
  };
}

interface StudioGenerationConsoleProps {
  pollIntervalMs?: number;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
}

export function StudioGenerationConsole({
  pollIntervalMs = 3000,
  showHeader = false,
  title = "Studio",
  subtitle = "Submit a raw image idea, let the refiner agent sharpen it, and watch the current Airtable-backed run complete.",
}: StudioGenerationConsoleProps) {
  const [promptText, setPromptText] = useState("");
  const [run, setRun] = useState<StudioRunState | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pollRun = useEffectEvent(async (recordId: string) => {
    try {
      const nextRun = await portalDataProvider.getStudioGeneration(recordId);
      setErrorText(null);
      setRun((current) => (current?.recordId === recordId ? toRunState(nextRun) : current));
    } catch (error) {
      setRun((current) =>
        current?.recordId === recordId ? { ...current, status: "error" } : current,
      );
      setErrorText(error instanceof Error ? error.message : "Unable to refresh generation");
    }
  });

  useEffect(() => {
    if (!run || run.status === "complete" || run.status === "error") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void pollRun(run.recordId);
    }, pollIntervalMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pollIntervalMs, run]);

  async function submitPrompt() {
    const nextPrompt = promptText.trim();

    if (!nextPrompt) {
      setErrorText("Enter a prompt before generating.");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const submission = await portalDataProvider.submitStudioPrompt({ prompt: nextPrompt });
      setRun({
        recordId: submission.recordId,
        prompt: nextPrompt,
        refinedPrompt: null,
        imageUrl: null,
        status: submission.status,
      });
    } catch (error) {
      setRun(null);
      setErrorText(error instanceof Error ? error.message : "Unable to create generation");
    } finally {
      setIsSubmitting(false);
    }
  }

  const badgeStatus = getBadgeState(run?.status ?? null, Boolean(errorText));
  const badgeLabel = errorText ? "error" : run?.status ?? "idle";

  return (
    <div className="space-y-5">
      {showHeader ? (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          action={<StatusBadge status={badgeStatus} label={badgeLabel} />}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="min-w-0 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                  Prompt Input
                </p>
                <h3 className="text-lg font-semibold">Generate via Airtable + n8n</h3>
              </div>
              {!showHeader ? <StatusBadge status={badgeStatus} label={badgeLabel} /> : null}
            </div>
            <p className="text-sm text-app-muted">
              Each submit creates a new Airtable workflow row, links the refiner agent, and triggers the existing generation webhook.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="studio-prompt" className="block text-sm text-app-muted">
              Raw prompt
            </label>
            <textarea
              id="studio-prompt"
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void submitPrompt();
                }
              }}
              placeholder="A futuristic desert temple at sunrise..."
              className="h-72 w-full rounded-md border border-app-border bg-app-bg p-3 font-mono text-sm text-app-text outline-none transition-colors duration-200 placeholder:text-app-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              spellCheck={false}
              data-testid="studio-prompt-input"
            />
          </div>

          {errorText ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorText}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void submitPrompt()}
              disabled={isSubmitting}
              data-testid="studio-generate"
            >
              {isSubmitting ? "Submitting..." : "Generate"}
            </Button>
            <p className="font-mono text-xs text-app-muted">Cmd/Ctrl + Enter</p>
          </div>
        </Panel>

        <Panel className="min-w-0 space-y-4" data-testid="studio-current-run">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Current Run
              </p>
              <h3 className="mt-2 text-lg font-semibold">Airtable-backed execution</h3>
            </div>
            {run ? (
              <p className="font-mono text-xs text-app-muted">Record {run.recordId}</p>
            ) : null}
          </div>

          <CodeBlock
            label="Prompt"
            code={run?.prompt ?? "Submit a prompt to create an Airtable workflow record."}
            wrap
          />

          <CodeBlock
            label="Refined Prompt"
            code={
              run?.refinedPrompt ??
              (run ? "Waiting for the refiner agent to write back to Airtable." : "No refined prompt yet.")
            }
            wrap
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-app-text">Image Result</h4>
              <p className="font-mono text-xs uppercase tracking-wide text-app-muted">
                {run?.status ?? "idle"}
              </p>
            </div>

            {run?.imageUrl ? (
              <div className="aspect-[16/9] max-h-[28rem] overflow-hidden rounded-lg border border-app-border bg-app-bg">
                {/* Result URLs come from Airtable/fal and are not known at build time. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={run.imageUrl}
                  alt="Generated output"
                  className="block h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-app-border bg-app-bg px-4 py-10 text-center text-sm text-app-muted">
                The current run will show its first returned Airtable image here.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
