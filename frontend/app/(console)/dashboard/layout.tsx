import type { ReactNode } from "react";
import { ConsoleShell } from "@/widgets/layout/console-shell";
import { PublicShell } from "@/widgets/layout/public-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <ConsoleShell>{children}</ConsoleShell>
    </PublicShell>
  );
}
