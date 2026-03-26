import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { CatalogExplorer } from "@/features/catalog/ui/catalog-explorer";

describe("CatalogExplorer", () => {
  it("renders development pills for flagged endpoints only", () => {
    render(<CatalogExplorer endpoints={endpointRegistry} />);

    expect(
      screen.getAllByText(
        "In development: these API endpoints are currently in development.",
      ),
    ).toHaveLength(5);
    expect(screen.getByText("Get Curriculum Week")).toBeInTheDocument();
    expect(screen.getByText("Knowledge Base Search")).toBeInTheDocument();
    expect(screen.getByText("Scrape Website")).toBeInTheDocument();
    expect(screen.getByText("Analyze Document")).toBeInTheDocument();
    expect(screen.getByText("Lead Enrichment")).toBeInTheDocument();
    expect(screen.queryByText("Get Transcript")).toBeInTheDocument();
    expect(screen.queryByText("Local Business Search")).toBeInTheDocument();
  });
});
