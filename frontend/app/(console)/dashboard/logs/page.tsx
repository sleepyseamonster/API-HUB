import { LogsTable } from "@/features/logs/ui/logs-table";
import { portalDataProvider } from "@/shared/providers/portal-data-provider";
import { SectionHeader } from "@/shared/ui/section-header";

export default async function LogsPage() {
  const logs = await portalDataProvider.listUsageLogs();

  return (
    <div id="main-content" className="space-y-5">
      <SectionHeader
        title="Execution Logs"
        subtitle="Inspect request status, latency, and credit impact in chronological order."
      />
      <LogsTable logs={logs} />
    </div>
  );
}
