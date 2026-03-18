import type { ReactNode } from "react";

interface TableShellProps {
  caption: string;
  header: ReactNode;
  body: ReactNode;
}

export function TableShell({ caption, header, body }: TableShellProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-app-border bg-panel">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-app-border bg-app-bg/60 text-xs uppercase tracking-wide text-app-muted">
          {header}
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}
