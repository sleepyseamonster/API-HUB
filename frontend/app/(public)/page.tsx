import Link from "next/link";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";

export default async function LandingPage() {
  const products = await portalDataProvider.listProducts();

  return (
    <div id="main-content" className="space-y-8">
      <section className="rounded-xl border border-app-border bg-panel px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
          API HUB Console
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
          Deploy your curriculum and automation workflows as a single API platform.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-app-muted">
          Discover endpoints, run playground tests, and hand students or clients one reliable integration surface.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/quickstart"
            className="rounded-md border border-accent bg-accent px-4 py-2 text-sm font-semibold text-app-bg"
          >
            Start Quickstart
          </Link>
          <Link
            href="/apis"
            className="rounded-md border border-app-border px-4 py-2 text-sm text-app-text transition-colors hover:border-accent"
          >
            Browse API Catalog
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="API Products"
          subtitle="Package endpoints by outcome, not by implementation detail."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Panel key={product.id} className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-wide text-accent">
                {product.category}
              </p>
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-app-muted">{product.summary}</p>
              <p className="text-xs text-app-muted">
                {product.endpointSlugs.length} endpoints
              </p>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}
