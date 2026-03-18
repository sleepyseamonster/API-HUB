import type { ReactNode } from "react";
import { PublicShell } from "@/widgets/layout/public-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
