import { LogsTable } from "@/features/logs/ui/logs-table";
import { formatNumber, formatPercent } from "@/shared/lib/format";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { SectionHeader } from "@/shared/ui/section-header";
import { StatTile } from "@/shared/ui/stat-tile";
import { UsageChart } from "@/widgets/sections/usage-chart";

export default async function DashboardPage() {
  const [summary, logs] = await Promise.all([
    portalDataProvider.getUsageSummary(),
    portalDataProvider.listUsageLogs(),
  ]);

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader
        title="Developer Console"
        subtitle="Track throughput, reliability, and credits in one control surface."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Calls" value={formatNumber(summary.totalCalls)} />
        <StatTile label="Success Rate" value={formatPercent(summary.successRate)} />
        <StatTile label="Credits Remaining" value={formatNumber(summary.creditsRemaining)} />
        <StatTile
          label="Credits Used (30d)"
          value={formatNumber(summary.creditsUsedThisMonth)}
        />
      </section>

      <UsageChart />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Logs</h3>
        <LogsTable logs={logs.slice(0, 4)} />
      </section>
    </div>
  );
}
