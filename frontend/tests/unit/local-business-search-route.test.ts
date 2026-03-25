import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/v1/tools/local-business-search/route";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

describe("local business search live route", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "test_google_places_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns normalized results from Google Places", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "https://places.googleapis.com/v1/places:searchText") {
        return jsonResponse({
          places: [
            {
              id: "place_1",
              displayName: { text: "Example Med Spa" },
              primaryType: "medical_spa",
              formattedAddress: "123 Main St, Scottsdale, AZ 85251",
              location: { latitude: 33.4942, longitude: -111.9261 },
              rating: 4.8,
              userRatingCount: 214,
              businessStatus: "OPERATIONAL",
              googleMapsUri: "https://maps.google.com/?cid=example",
            },
          ],
        });
      }

      if (url === "https://places.googleapis.com/v1/places/place_1") {
        return jsonResponse({
          nationalPhoneNumber: "(480) 555-1111",
          websiteUri: "https://example.com",
          currentOpeningHours: {
            openNow: true,
            weekdayDescriptions: ["Monday: 9:00 AM - 5:00 PM"],
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const request = new Request("http://localhost/v1/tools/local-business-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "med spa",
        location: "Scottsdale, AZ",
        limit: 10,
        include_contact_fields: true,
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://places.googleapis.com/v1/places:searchText",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "test_google_places_key",
          "X-Goog-FieldMask": expect.stringContaining("places.id"),
        }),
      }),
    );
    expect(body).toMatchObject({
      status: "success",
      message: "Search complete",
      data: {
        query: "med spa",
        location: "Scottsdale, AZ",
        results: [
          {
            place_id: "place_1",
            name: "Example Med Spa",
            phone: "(480) 555-1111",
            website: "https://example.com",
            opening_hours: {
              open_now: true,
              weekday_descriptions: ["Monday: 9:00 AM - 5:00 PM"],
            },
          },
        ],
      },
    });
  });

  it("returns validation errors for bad input", async () => {
    const request = new Request("http://localhost/v1/tools/local-business-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: "Scottsdale, AZ",
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "error",
      message: "`query` is required.",
      error: {
        code: "validation_error",
        retryable: false,
      },
    });
  });

  it("returns upstream errors from Google Places", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "quota exceeded",
          },
        },
        { status: 429 },
      ),
    );

    const request = new Request("http://localhost/v1/tools/local-business-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "med spa",
        location: "Scottsdale, AZ",
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      status: "error",
      message: "Google Places request failed.",
      error: {
        code: "upstream_error",
        retryable: true,
      },
    });
  });
});
