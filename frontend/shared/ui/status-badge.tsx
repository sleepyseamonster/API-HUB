import { cn } from "@/shared/lib/cn";
import type { RequestState } from "@/shared/types/portal";

const stateStyles: Record<RequestState, string> = {
  success: "border-green-500/40 bg-green-500/12 text-green-300",
  error: "border-red-500/40 bg-red-500/12 text-red-300",
  running: "border-accent/40 bg-accent/12 text-accent",
  idle: "border-app-border bg-transparent text-app-muted",
};

export function StatusBadge({
  status,
  label,
}: {
  status: RequestState;
  label?: string;
}) {
  return (
    <span
      data-testid="status-badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wide",
        stateStyles[status],
      )}
    >
      {label ?? status}
    </span>
  );
}
