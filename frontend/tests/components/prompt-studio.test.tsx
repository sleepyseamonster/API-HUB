import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromptStudio } from "@/features/studio/ui/prompt-studio";

const { submitStudioPrompt, getStudioGeneration } = vi.hoisted(() => ({
  submitStudioPrompt: vi.fn(),
  getStudioGeneration: vi.fn(),
}));

vi.mock("@/shared/providers/portal-data-provider", () => ({
  portalDataProvider: {
    submitStudioPrompt,
    getStudioGeneration,
  },
}));

describe("PromptStudio", () => {
  beforeEach(() => {
    submitStudioPrompt.mockReset();
    getStudioGeneration.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the idle state", () => {
    render(<PromptStudio />);

    expect(screen.getByText("Studio")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("idle");
    expect(screen.getByTestId("studio-current-run")).toHaveTextContent(
      "Submit a prompt to create an Airtable workflow record.",
    );
  });

  it("submits a prompt, polls, and renders the refined prompt and final image", async () => {
    submitStudioPrompt.mockResolvedValue({
      recordId: "rec_1",
      status: "queued",
    });
    getStudioGeneration
      .mockResolvedValueOnce({
        recordId: "rec_1",
        prompt: "desert temple",
        refinedPrompt: "cinematic desert temple at sunrise",
        imageUrl: null,
        status: "generating",
      })
      .mockResolvedValueOnce({
        recordId: "rec_1",
        prompt: "desert temple",
        refinedPrompt: "cinematic desert temple at sunrise",
        imageUrl: "https://example.com/final.png",
        status: "complete",
      });

    render(<PromptStudio pollIntervalMs={1} />);

    fireEvent.change(screen.getByTestId("studio-prompt-input"), {
      target: { value: "desert temple" },
    });
    fireEvent.click(screen.getByTestId("studio-generate"));

    await waitFor(() => {
      expect(submitStudioPrompt).toHaveBeenCalledWith({ prompt: "desert temple" });
    });

    expect(screen.getByTestId("status-badge")).toHaveTextContent("queued");
    expect(screen.getByTestId("studio-current-run")).toHaveTextContent("Record rec_1");

    await waitFor(() => {
      expect(getStudioGeneration).toHaveBeenCalledWith("rec_1");
      expect(screen.getByText("cinematic desert temple at sunrise")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByAltText("Generated output")).toHaveAttribute(
        "src",
        "https://example.com/final.png",
      );
      expect(screen.getByTestId("status-badge")).toHaveTextContent("complete");
    });

    expect(screen.getByAltText("Generated output")).toHaveClass("object-contain");
  });

  it("replaces the tracked run when a second prompt is submitted", async () => {
    submitStudioPrompt
      .mockResolvedValueOnce({ recordId: "rec_1", status: "queued" })
      .mockResolvedValueOnce({ recordId: "rec_2", status: "queued" });

    render(<PromptStudio pollIntervalMs={1} />);

    fireEvent.change(screen.getByTestId("studio-prompt-input"), {
      target: { value: "first prompt" },
    });
    fireEvent.click(screen.getByTestId("studio-generate"));

    await waitFor(() => {
      expect(screen.getByTestId("studio-current-run")).toHaveTextContent("Record rec_1");
    });

    fireEvent.change(screen.getByTestId("studio-prompt-input"), {
      target: { value: "second prompt" },
    });
    fireEvent.click(screen.getByTestId("studio-generate"));

    await waitFor(() => {
      expect(screen.getByTestId("studio-current-run")).toHaveTextContent("Record rec_2");
      expect(screen.getByTestId("studio-current-run")).toHaveTextContent("second prompt");
    });
  });
});
