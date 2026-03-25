import {
  buildLocalBusinessTextQuery,
  mergePlaceDetails,
  normalizeTextSearchPlaces,
  type LocalBusinessRecord,
  type LocalBusinessSearchInput,
} from "@/shared/lib/local-business-search";

const GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.googleMapsUri",
].join(",");

const DETAILS_FIELD_MASK = ["id", "nationalPhoneNumber", "websiteUri", "currentOpeningHours"].join(
  ",",
);

interface GoogleTextSearchResponse {
  places?: Array<Record<string, unknown>>;
}

interface GooglePlaceDetailsResponse {
  id?: unknown;
  nationalPhoneNumber?: unknown;
  websiteUri?: unknown;
  currentOpeningHours?: unknown;
}

export class UpstreamRequestError extends Error {
  details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "UpstreamRequestError";
    this.details = details;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getApiKey(): string {
  return getRequiredEnv("GOOGLE_PLACES_API_KEY");
}

async function googleRequest<T>(url: string, init: RequestInit, fieldMask: string): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new UpstreamRequestError("Google Places request failed.", {
      status: response.status,
      statusText: response.statusText,
      response: body ?? {},
    });
  }

  return (body ?? {}) as T;
}

async function searchPlaces(input: LocalBusinessSearchInput): Promise<LocalBusinessRecord[]> {
  const response = await googleRequest<GoogleTextSearchResponse>(
    GOOGLE_TEXT_SEARCH_URL,
    {
      method: "POST",
      body: JSON.stringify({
        textQuery: buildLocalBusinessTextQuery(input),
        pageSize: input.limit,
      }),
    },
    SEARCH_FIELD_MASK,
  );

  return normalizeTextSearchPlaces(response.places);
}

async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetailsResponse> {
  return googleRequest<GooglePlaceDetailsResponse>(
    `${GOOGLE_PLACE_DETAILS_URL}/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
    },
    DETAILS_FIELD_MASK,
  );
}

export async function runLocalBusinessSearch(
  input: LocalBusinessSearchInput,
): Promise<LocalBusinessRecord[]> {
  const searchResults = await searchPlaces(input);

  if (!input.includeContactFields || searchResults.length === 0) {
    return searchResults;
  }

  const details = await Promise.all(
    searchResults.map(async (result) => {
      const detail = await fetchPlaceDetails(result.place_id);
      return [result.place_id, detail] as const;
    }),
  );

  return mergePlaceDetails(searchResults, new Map(details));
}
