import { describe, expect, it } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { filterEndpoints, normalizeQuery } from "@/entities/endpoints/model/search";

describe("endpoint search helpers", () => {
  it("normalizes search terms", () => {
    expect(normalizeQuery("  LEAD Enrichment ")).toBe("lead enrichment");
  });

  it("filters by query and category", () => {
    const results = filterEndpoints(endpointRegistry, {
      query: "lead",
      category: "automation",
    });

    expect(results.some((item) => item.slug === "lead-enrichment")).toBe(true);
    expect(results.every((item) => item.category === "automation")).toBe(true);
  });

  it("returns all endpoints when no filters are set", () => {
    expect(filterEndpoints(endpointRegistry)).toHaveLength(endpointRegistry.length);
  });
});
