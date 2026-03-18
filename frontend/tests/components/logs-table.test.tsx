import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogsTable } from "@/features/logs/ui/logs-table";
import type { UsageLogRow } from "@/shared/types/portal";

const logs: UsageLogRow[] = [
  {
    id: "one",
    endpointSlug: "scrape-website",
    method: "POST",
    path: "/v1/tools/scrape-website",
    statusCode: 200,
    latencyMs: 250,
    creditsSpent: 3,
    timestampIso: "2026-03-11T17:19:00.000Z",
  },
];

describe("LogsTable", () => {
  it("shows empty state", () => {
    render(<LogsTable logs={[]} />);

    expect(screen.getByText("No logs found for this time range.")).toBeInTheDocument();
  });

  it("renders rows", () => {
    render(<LogsTable logs={logs} />);

    expect(screen.getByText("/v1/tools/scrape-website")).toBeInTheDocument();
    expect(screen.getByText("250ms")).toBeInTheDocument();
  });
});
