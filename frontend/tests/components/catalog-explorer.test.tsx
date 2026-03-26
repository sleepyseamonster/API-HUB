import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { CatalogExplorer } from "@/features/catalog/ui/catalog-explorer";

describe("CatalogExplorer", () => {
  it("renders development and live pills for flagged endpoints", () => {
    render(<CatalogExplorer endpoints={endpointRegistry} />);

    expect(screen.getAllByText("In development")).toHaveLength(5);
    expect(screen.getAllByText("Demo")).toHaveLength(3);
    expect(screen.getByText("Get Curriculum Week")).toBeInTheDocument();
    expect(screen.getByText("Knowledge Base Search")).toBeInTheDocument();
    expect(screen.getByText("Scrape Website")).toBeInTheDocument();
    expect(screen.getByText("Analyze Document")).toBeInTheDocument();
    expect(screen.getByText("Lead Enrichment")).toBeInTheDocument();
    expect(screen.queryByText("Get Transcript")).not.toBeInTheDocument();
    expect(screen.queryByText("Transcript Ingest")).toBeInTheDocument();
    expect(screen.queryByText("Local Business Search")).toBeInTheDocument();
  });
});
