import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPreviewRouteForEndpoint,
  isPreviewBackedEndpoint,
} from "@/shared/lib/endpoint-runtime";
import { createPortalDataProvider } from "@/shared/providers/portal-data-provider";

describe("endpoint runtime helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks local-business-search as preview-backed", () => {
    expect(isPreviewBackedEndpoint("local-business-search")).toBe(true);
    expect(getPreviewRouteForEndpoint("local-business-search")).toBe(
      "/api/playground/local-business-search",
    );
    expect(isPreviewBackedEndpoint("lead-enrichment")).toBe(false);
    expect(getPreviewRouteForEndpoint("lead-enrichment")).toBeNull();
  });

  it("routes preview-backed playground calls through fetch", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: { results: [] },
          message: "Search complete",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const provider = createPortalDataProvider();
    const result = await provider.runPlayground({
      slug: "local-business-search",
      payload: {
        query: "plumber",
        location: "Phoenix, AZ",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/playground/local-business-search",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result.status).toBe("success");
    expect(result.statusCode).toBe(200);
  });
});
