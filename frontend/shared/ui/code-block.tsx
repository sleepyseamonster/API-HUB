import { cn } from "@/shared/lib/cn";

interface CodeBlockProps {
  code: string;
  label?: string;
  className?: string;
}

export function CodeBlock({ code, label, className }: CodeBlockProps) {
  return (
    <div className={cn("rounded-lg border border-app-border bg-app-bg", className)}>
      {label ? (
        <div className="border-b border-app-border px-3 py-2 font-mono text-xs uppercase tracking-wide text-app-muted">
          {label}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-app-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}
