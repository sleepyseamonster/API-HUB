import { cn } from "@/shared/lib/cn";

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}

export function StatTile({ label, value, detail, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-app-border bg-panel px-4 py-3",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-app-text">{value}</p>
      {detail ? <p className="mt-1 text-xs text-app-muted">{detail}</p> : null}
    </div>
  );
}
