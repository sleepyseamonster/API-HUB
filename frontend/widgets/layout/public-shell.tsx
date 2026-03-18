import type { ReactNode } from "react";
import { SiteHeader } from "@/widgets/navigation/site-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
