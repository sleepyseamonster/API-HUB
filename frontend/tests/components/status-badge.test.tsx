import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/shared/ui/status-badge";

describe("StatusBadge", () => {
  it("renders success state label", () => {
    render(<StatusBadge status="success" />);

    expect(screen.getByText("success")).toBeInTheDocument();
  });

  it("renders error state label", () => {
    render(<StatusBadge status="error" />);

    expect(screen.getByText("error")).toBeInTheDocument();
  });
});
