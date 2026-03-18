import { notFound } from "next/navigation";
import { PlaygroundConsole } from "@/features/playground/ui/playground-console";
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

      <PlaygroundConsole endpoint={endpoint} />
    </div>
  );
}
