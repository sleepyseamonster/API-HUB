import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { LocalBusinessSearchConsole } from "@/features/local-business-search/ui/local-business-search-console";

const { runPlayground } = vi.hoisted(() => ({
  runPlayground: vi.fn().mockResolvedValue({
    status: "success",
    statusCode: 200,
    latencyMs: 240,
    message: "Search complete",
    body: {
      status: "success",
      data: {
        results: [
          {
            place_id: "place_1",
            name: "Example Med Spa",
            primary_type: "medical_spa",
            address: "123 Main St, Scottsdale, AZ 85251",
            rating: 4.8,
            review_count: 214,
            phone: "(480) 555-1111",
            website: "https://example.com",
          },
        ],
      },
    },
  }),
}));

vi.mock("@/shared/providers/portal-data-provider", () => ({
  portalDataProvider: {
    runPlayground,
  },
}));

afterEach(() => {
  cleanup();
  runPlayground.mockClear();
});

describe("LocalBusinessSearchConsole", () => {
  it("maps form fields into a local business search payload", async () => {
    const endpoint = endpointRegistry.find((item) => item.slug === "local-business-search");

    if (!endpoint) {
      throw new Error("Expected local-business-search endpoint");
    }

    render(<LocalBusinessSearchConsole endpoint={endpoint} />);

    fireEvent.change(screen.getByLabelText("Business type"), {
      target: { value: "med spa" },
    });
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Scottsdale" },
    });
    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "az" },
    });
    fireEvent.change(screen.getByLabelText("Max results"), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByTestId("run-local-business-search"));

    await waitFor(() => {
      expect(runPlayground).toHaveBeenCalledWith({
        slug: "local-business-search",
        payload: {
          query: "med spa",
          location: "Scottsdale, AZ",
          limit: 12,
          include_contact_fields: true,
        },
      });
    });

    expect(screen.getByText("Example Med Spa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("shows validation feedback when the form is incomplete", async () => {
    const endpoint = endpointRegistry.find((item) => item.slug === "local-business-search");

    if (!endpoint) {
      throw new Error("Expected local-business-search endpoint");
    }

    render(<LocalBusinessSearchConsole endpoint={endpoint} />);

    fireEvent.click(screen.getByTestId("run-local-business-search"));

    expect(
      screen.getByText(
        "Enter a business type, city, state, and a max result count between 1 and 20.",
      ),
    ).toBeInTheDocument();
    expect(runPlayground).not.toHaveBeenCalled();
  });
});
