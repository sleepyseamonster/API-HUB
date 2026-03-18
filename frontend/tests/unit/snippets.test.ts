import { describe, expect, it } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { generateCodeSnippets } from "@/shared/lib/snippets";

describe("generateCodeSnippets", () => {
  it("returns snippets for curl/javascript/python/ruby", () => {
    const endpoint = endpointRegistry.find((item) => item.slug === "lead-enrichment");
    if (!endpoint) {
      throw new Error("Expected lead-enrichment endpoint");
    }

    const snippets = generateCodeSnippets({
      endpoint,
      payload: endpoint.requestExample.payload,
      apiKey: "hub_test_key",
      baseUrl: "https://api.test.local",
    });

    expect(snippets).toHaveLength(4);
    expect(snippets.map((snippet) => snippet.language)).toEqual([
      "curl",
      "javascript",
      "python",
      "ruby",
    ]);

    expect(snippets[0].content).toContain("-X POST");
    expect(snippets[0].content).toContain("hub_test_key");
    expect(snippets[1].content).toContain("fetch(\"https://api.test.local/v1/tools/lead-enrichment\"");
    expect(snippets[2].content).toContain("requests.post");
    expect(snippets[3].content).toContain("Net::HTTP::Post");
  });
});
