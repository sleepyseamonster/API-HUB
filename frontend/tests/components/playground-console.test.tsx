import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { PlaygroundConsole } from "@/features/playground/ui/playground-console";

vi.mock("@/shared/providers/portal-data-provider", () => ({
  portalDataProvider: {
    runPlayground: vi.fn().mockResolvedValue({
      status: "success",
      statusCode: 200,
      latencyMs: 160,
      message: "ok",
      body: {
        status: "success",
        data: { id: "demo" },
      },
    }),
  },
}));

afterEach(() => {
  cleanup();
});

describe("PlaygroundConsole", () => {
  it("runs simulation and renders response panel", async () => {
    const endpoint = endpointRegistry[0];
    render(<PlaygroundConsole endpoint={endpoint} />);

    fireEvent.click(screen.getByTestId("run-playground"));

    await waitFor(() => {
      expect(screen.getByTestId("playground-response")).toHaveTextContent("200 • 160ms");
    });

    expect(screen.getByText(/"status": "success"/)).toBeInTheDocument();
  });

  it("shows preview-backed copy for local-business-search", async () => {
    const endpoint = endpointRegistry.find((item) => item.slug === "local-business-search");

    if (!endpoint) {
      throw new Error("Expected local-business-search endpoint");
    }

    render(<PlaygroundConsole endpoint={endpoint} />);

    expect(screen.getByText(/Preview-backed in portal/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Simulation mode")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("run-playground"));

    await waitFor(() => {
      expect(screen.getByTestId("playground-response")).toHaveTextContent("200 • 160ms");
    });
  });
});
