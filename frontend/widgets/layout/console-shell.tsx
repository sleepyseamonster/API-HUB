import type { ReactNode } from "react";
import { DashboardNav } from "@/widgets/navigation/dashboard-nav";

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <DashboardNav />
      {children}
    </div>
  );
}
