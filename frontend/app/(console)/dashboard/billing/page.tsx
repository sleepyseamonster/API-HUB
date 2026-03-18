import { formatCurrency, formatNumber } from "@/shared/lib/format";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { Panel } from "@/shared/ui/panel";
import { SectionHeader } from "@/shared/ui/section-header";

export default async function BillingPage() {
  const packs = await portalDataProvider.getBillingPacks();

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader
        title="Billing"
        subtitle="Credit packs and spend controls. Stripe integration is deferred in this pass."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {packs.map((pack) => (
          <Panel key={pack.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{pack.name}</h3>
              {pack.popular ? (
                <span className="rounded-full border border-accent px-2 py-1 text-xs text-accent">
                  Most popular
                </span>
              ) : null}
            </div>
            <p className="text-3xl font-semibold text-app-text">{formatCurrency(pack.priceUsd)}</p>
            <p className="text-sm text-app-muted">{formatNumber(pack.credits)} credits</p>
            <button
              type="button"
              className="h-10 w-full rounded-md border border-accent text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-app-bg"
            >
              Select Pack
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
