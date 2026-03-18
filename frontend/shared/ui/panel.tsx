import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "animate-panel rounded-lg border border-app-border bg-panel p-5 shadow-panel",
        className,
      )}
      {...props}
    />
  );
}
