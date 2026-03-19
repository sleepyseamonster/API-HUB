import { cn } from "@/shared/lib/cn";

interface CodeBlockProps {
  code: string;
  label?: string;
  className?: string;
  wrap?: boolean;
}

export function CodeBlock({ code, label, className, wrap = false }: CodeBlockProps) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-app-border bg-app-bg", className)}>
      {label ? (
        <div className="border-b border-app-border px-3 py-2 font-mono text-xs uppercase tracking-wide text-app-muted">
          {label}
        </div>
      ) : null}
      <pre
        className={cn(
          "p-3 text-xs leading-relaxed text-app-text",
          wrap ? "overflow-x-hidden whitespace-pre-wrap break-words" : "overflow-x-auto",
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
