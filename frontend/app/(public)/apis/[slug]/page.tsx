import { notFound } from "next/navigation";
import { LocalBusinessSearchConsole } from "@/features/local-business-search/ui/local-business-search-console";
import { PlaygroundConsole } from "@/features/playground/ui/playground-console";
import { StudioGenerationConsole } from "@/features/studio/ui/studio-generation-console";
import { TranscriptIngestConsole } from "@/features/transcript-ingest/ui/transcript-ingest-console";
import { isPreviewBackedEndpoint } from "@/shared/lib/endpoint-runtime";
import { CodeBlock } from "@/shared/ui/code-block";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";

interface EndpointDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EndpointDetailPage({ params }: EndpointDetailPageProps) {
  const { slug } = await params;
  const endpoint = await portalDataProvider.getEndpointBySlug(slug);

  if (!endpoint) {
    notFound();
  }

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader title={endpoint.title} subtitle={endpoint.summary} />

      {isPreviewBackedEndpoint(endpoint.slug) ? (
        <Panel className="border-accent/40 bg-accent/5">
          <p className="text-sm text-app-muted">
            This endpoint has an internal portal preview path. A temporary public demo route is live at `/v1/tools/local-business-search` without auth or credits.
          </p>
        </Panel>
      ) : endpoint.slug === "transcript-ingest" ? (
        <Panel className="border-accent/40 bg-accent/5">
          <p className="text-sm text-app-muted">
            This endpoint is a temporary public demo route at `/v1/tools/transcript-ingest`. It accepts one uploaded `.txt` or `.md` file and forwards it to the live transcript intake workflow without auth or credits.
          </p>
        </Panel>
      ) : endpoint.slug === "google-nano-banana-gen" ? (
        <Panel className="border-accent/40 bg-accent/5">
          <p className="text-sm text-app-muted">
            This endpoint is a temporary public demo route at `/v1/tools/google-nano-banana-gen`. It accepts one raw prompt, creates an Airtable workflow record, and triggers the live generation webhook without auth or credits.
          </p>
        </Panel>
      ) : null}

      <Panel className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-app-muted">Method</p>
          <p className="mt-2 font-mono text-sm text-accent">{endpoint.method}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-app-muted">Path</p>
          <p className="mt-2 font-mono text-sm text-app-text">{endpoint.path}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-app-muted">Credits / call</p>
          <p className="mt-2 text-sm text-app-text">{endpoint.creditsPerCall}</p>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">Request Example</h3>
          <CodeBlock code={JSON.stringify(endpoint.requestExample.payload, null, 2)} />
        </Panel>
        <Panel className="space-y-3">
          <h3 className="text-lg font-semibold">Response Example</h3>
          <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />
        </Panel>
      </div>

      {endpoint.slug === "local-business-search" ? (
        <LocalBusinessSearchConsole endpoint={endpoint} />
      ) : endpoint.slug === "google-nano-banana-gen" ? (
        <StudioGenerationConsole />
      ) : endpoint.slug === "transcript-ingest" ? (
        <TranscriptIngestConsole endpoint={endpoint} />
      ) : (
        <PlaygroundConsole endpoint={endpoint} />
      )}
    </div>
  );
}
