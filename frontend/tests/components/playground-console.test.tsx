import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
});
