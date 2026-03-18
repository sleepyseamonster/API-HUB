import { formatDate } from "@/shared/lib/format";
import { TableShell } from "@/shared/ui/table-shell";
import type { UsageLogRow } from "@/shared/types/portal";

export function LogsTable({ logs }: { logs: UsageLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-muted">
        No logs found for this time range.
      </div>
    );
  }

  return (
    <TableShell
      caption="Usage logs"
      header={
        <tr>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Endpoint</th>
          <th className="px-3 py-2">Latency</th>
          <th className="px-3 py-2">Credits</th>
          <th className="px-3 py-2">Time</th>
        </tr>
      }
      body={logs.map((log) => (
        <tr key={log.id} className="border-t border-app-border text-sm">
          <td className="px-3 py-2 font-mono text-xs">
            <span
              className={
                log.statusCode >= 400
                  ? "text-red-300"
                  : "text-green-300"
              }
            >
              {log.statusCode}
            </span>
          </td>
          <td className="px-3 py-2">
            <p className="font-mono text-xs text-app-muted">{log.method}</p>
            <p className="text-sm text-app-text">{log.path}</p>
          </td>
          <td className="px-3 py-2 text-app-muted">{log.latencyMs}ms</td>
          <td className="px-3 py-2 text-app-muted">{log.creditsSpent}</td>
          <td className="px-3 py-2 text-app-muted">{formatDate(log.timestampIso)}</td>
        </tr>
      ))}
    />
  );
}
