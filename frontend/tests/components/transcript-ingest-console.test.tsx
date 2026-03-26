import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { TranscriptIngestConsole } from "@/features/transcript-ingest/ui/transcript-ingest-console";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TranscriptIngestConsole", () => {
  it("uploads a selected transcript file to the live route", async () => {
    const endpoint = endpointRegistry.find((item) => item.slug === "transcript-ingest");

    if (!endpoint) {
      throw new Error("Expected transcript-ingest endpoint");
    }

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          message: "Processing completed.",
          data: {
            source_filename: "lesson.txt",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<TranscriptIngestConsole endpoint={endpoint} />);

    const file = new File(["hello"], "lesson.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Transcript file"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByTestId("run-transcript-ingest"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/v1/tools/transcript-ingest",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });

    expect(screen.getByTestId("transcript-ingest-response")).toHaveTextContent("200");
    expect(screen.getByText(/"source_filename": "lesson.txt"/)).toBeInTheDocument();
  });
});
