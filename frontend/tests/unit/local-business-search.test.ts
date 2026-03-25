import { describe, expect, it } from "vitest";
import {
  buildLocalBusinessTextQuery,
  LocalBusinessSearchValidationError,
  mergePlaceDetails,
  normalizeOpeningHours,
  normalizeTextSearchPlaces,
  validateLocalBusinessSearchInput,
} from "@/shared/lib/local-business-search";

describe("local business search helpers", () => {
  it("validates and defaults a valid payload", () => {
    expect(
      validateLocalBusinessSearchInput({
        query: "med spa",
        location: "Scottsdale, AZ",
      }),
    ).toEqual({
      query: "med spa",
      location: "Scottsdale, AZ",
      limit: 10,
      includeContactFields: false,
    });
  });

  it("rejects invalid payloads", () => {
    expect(() => validateLocalBusinessSearchInput(null)).toThrow(
      LocalBusinessSearchValidationError,
    );
    expect(() => validateLocalBusinessSearchInput({ location: "Phoenix, AZ" })).toThrow(
      "`query` is required.",
    );
    expect(() => validateLocalBusinessSearchInput({ query: "roofer", location: "" })).toThrow(
      "`location` is required.",
    );
    expect(() =>
      validateLocalBusinessSearchInput({
        query: "roofer",
        location: "Phoenix, AZ",
        limit: 25,
      }),
    ).toThrow("`limit` must be an integer between 1 and 20.");
  });

  it("builds a text query from query and location", () => {
    const input = validateLocalBusinessSearchInput({
      query: "plumber",
      location: "Phoenix, AZ",
      limit: 5,
      include_contact_fields: true,
    });

    expect(buildLocalBusinessTextQuery(input)).toBe("plumber in Phoenix, AZ");
  });

  it("normalizes text search places into stable records", () => {
    expect(
      normalizeTextSearchPlaces([
        {
          id: "place_1",
          displayName: { text: "Example Plumbing" },
          primaryType: "plumber",
          formattedAddress: "123 Main St, Phoenix, AZ 85001",
          location: { latitude: 33.4484, longitude: -112.074 },
          rating: 4.7,
          userRatingCount: 83,
          businessStatus: "OPERATIONAL",
          googleMapsUri: "https://maps.google.com/?cid=123",
        },
        {
          id: null,
          displayName: { text: "Broken Entry" },
        },
      ]),
    ).toEqual([
      {
        place_id: "place_1",
        name: "Example Plumbing",
        primary_type: "plumber",
        address: "123 Main St, Phoenix, AZ 85001",
        latitude: 33.4484,
        longitude: -112.074,
        rating: 4.7,
        review_count: 83,
        business_status: "OPERATIONAL",
        google_maps_uri: "https://maps.google.com/?cid=123",
        phone: null,
        website: null,
        opening_hours: null,
      },
    ]);
  });

  it("normalizes opening hours and merges place details", () => {
    const merged = mergePlaceDetails(
      [
        {
          place_id: "place_1",
          name: "Example Plumbing",
          primary_type: "plumber",
          address: "123 Main St",
          latitude: 1,
          longitude: 2,
          rating: 4.5,
          review_count: 10,
          business_status: "OPERATIONAL",
          google_maps_uri: "https://maps.google.com/?cid=123",
          phone: null,
          website: null,
          opening_hours: null,
        },
      ],
      new Map([
        [
          "place_1",
          {
            nationalPhoneNumber: "(602) 555-1111",
            websiteUri: "https://example.com",
            currentOpeningHours: {
              openNow: true,
              weekdayDescriptions: ["Monday: 9:00 AM - 5:00 PM"],
            },
          },
        ],
      ]),
    );

    expect(normalizeOpeningHours(null)).toBeNull();
    expect(merged[0]).toMatchObject({
      phone: "(602) 555-1111",
      website: "https://example.com",
      opening_hours: {
        open_now: true,
        weekday_descriptions: ["Monday: 9:00 AM - 5:00 PM"],
      },
    });
  });
});
