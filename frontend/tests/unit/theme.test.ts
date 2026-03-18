import { describe, expect, it } from "vitest";
import { palette, withAlpha } from "@/shared/lib/theme";

describe("theme utilities", () => {
  it("exposes locked four-color palette", () => {
    expect(palette).toEqual({
      appBg: "#121212",
      panel: "#1A1A1A",
      accent: "#25A9BF",
      text: "#EDEDED",
    });
  });

  it("adds alpha channel to hex color", () => {
    expect(withAlpha("#25A9BF", 0.5)).toBe("#25A9BF80");
  });

  it("returns original value for invalid hex", () => {
    expect(withAlpha("#abc", 0.5)).toBe("#abc");
  });
});
