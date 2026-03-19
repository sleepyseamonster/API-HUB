import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "@/shared/ui/code-block";

describe("CodeBlock", () => {
  it("uses horizontal scrolling for code by default", () => {
    render(<CodeBlock code={"const value = 'demo';"} />);

    expect(screen.getByText("const value = 'demo';").closest("pre")).toHaveClass("overflow-x-auto");
  });

  it("supports wrapped text mode for prose-like content", () => {
    render(<CodeBlock code={"a very long prompt"} wrap />);

    expect(screen.getByText("a very long prompt").closest("pre")).toHaveClass(
      "overflow-x-hidden",
      "whitespace-pre-wrap",
      "break-words",
    );
  });
});
