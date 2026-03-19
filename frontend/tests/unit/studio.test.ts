import { describe, expect, it } from "vitest";
import {
  deriveStudioGenerationStatus,
  normalizeStudioGenerationRecord,
} from "@/shared/lib/studio";

describe("deriveStudioGenerationStatus", () => {
  it("returns refining when no refined prompt or image exist", () => {
    expect(
      deriveStudioGenerationStatus({
        refinedPrompt: null,
        imageUrl: null,
      }),
    ).toBe("refining");
  });

  it("returns generating when a refined prompt exists without an image", () => {
    expect(
      deriveStudioGenerationStatus({
        refinedPrompt: "cinematic close-up",
        imageUrl: null,
      }),
    ).toBe("generating");
  });

  it("returns complete when an image exists", () => {
    expect(
      deriveStudioGenerationStatus({
        refinedPrompt: "cinematic close-up",
        imageUrl: "https://example.com/image.png",
      }),
    ).toBe("complete");
  });
});

describe("normalizeStudioGenerationRecord", () => {
  it("maps Airtable fields into a studio generation shape", () => {
    expect(
      normalizeStudioGenerationRecord({
        id: "rec_123",
        fields: {
          Prompt: "desert temple",
          "Refined Prompt": "cinematic desert temple at sunrise",
          Image: [{ url: "https://example.com/final.png" }],
        },
      }),
    ).toEqual({
      recordId: "rec_123",
      prompt: "desert temple",
      refinedPrompt: "cinematic desert temple at sunrise",
      imageUrl: "https://example.com/final.png",
      status: "complete",
    });
  });

  it("safely handles missing Airtable fields", () => {
    expect(
      normalizeStudioGenerationRecord({
        id: "rec_456",
        fields: {},
      }),
    ).toEqual({
      recordId: "rec_456",
      prompt: "",
      refinedPrompt: null,
      imageUrl: null,
      status: "refining",
    });
  });
});
