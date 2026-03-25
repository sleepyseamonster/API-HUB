export interface LocalBusinessSearchInput {
  query: string;
  location: string;
  limit: number;
  includeContactFields: boolean;
}

export interface LocalBusinessOpeningHours {
  open_now: boolean | null;
  weekday_descriptions: string[];
}

export interface LocalBusinessRecord {
  place_id: string;
  name: string;
  primary_type: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  review_count: number | null;
  business_status: string | null;
  google_maps_uri: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: LocalBusinessOpeningHours | null;
}

interface GoogleLatLng {
  latitude?: unknown;
  longitude?: unknown;
}

interface GoogleDisplayName {
  text?: unknown;
}

interface GoogleTextSearchPlace {
  id?: unknown;
  displayName?: GoogleDisplayName | null;
  primaryType?: unknown;
  formattedAddress?: unknown;
  location?: GoogleLatLng | null;
  rating?: unknown;
  userRatingCount?: unknown;
  businessStatus?: unknown;
  googleMapsUri?: unknown;
}

interface GooglePlaceDetailsLike {
  id?: unknown;
  nationalPhoneNumber?: unknown;
  websiteUri?: unknown;
  currentOpeningHours?: unknown;
}

export class LocalBusinessSearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalBusinessSearchValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function validateLocalBusinessSearchInput(body: unknown): LocalBusinessSearchInput {
  if (!isRecord(body)) {
    throw new LocalBusinessSearchValidationError("Payload must be a JSON object.");
  }

  const query = asTrimmedString(body.query);
  if (!query) {
    throw new LocalBusinessSearchValidationError("`query` is required.");
  }

  const location = asTrimmedString(body.location);
  if (!location) {
    throw new LocalBusinessSearchValidationError("`location` is required.");
  }

  const rawLimit = body.limit;
  const limit =
    rawLimit === undefined
      ? 10
      : typeof rawLimit === "number" && Number.isInteger(rawLimit)
        ? rawLimit
        : null;

  if (limit === null || limit < 1 || limit > 20) {
    throw new LocalBusinessSearchValidationError("`limit` must be an integer between 1 and 20.");
  }

  const rawIncludeContactFields = body.include_contact_fields;
  if (rawIncludeContactFields !== undefined && typeof rawIncludeContactFields !== "boolean") {
    throw new LocalBusinessSearchValidationError(
      "`include_contact_fields` must be a boolean when provided.",
    );
  }

  return {
    query,
    location,
    limit,
    includeContactFields: rawIncludeContactFields ?? false,
  };
}

export function buildLocalBusinessTextQuery(input: LocalBusinessSearchInput): string {
  return `${input.query} in ${input.location}`;
}

export function normalizeTextSearchPlaces(places: GoogleTextSearchPlace[] | undefined): LocalBusinessRecord[] {
  if (!Array.isArray(places)) {
    return [];
  }

  const normalized: Array<LocalBusinessRecord | null> = places
    .map((place) => {
      const placeId = asString(place.id);
      const name =
        place.displayName && typeof place.displayName.text === "string"
          ? place.displayName.text
          : null;

      if (!placeId || !name) {
        return null;
      }

      const latitude =
        place.location && typeof place.location.latitude === "number"
          ? place.location.latitude
          : null;
      const longitude =
        place.location && typeof place.location.longitude === "number"
          ? place.location.longitude
          : null;

      return {
        place_id: placeId,
        name,
        primary_type: asString(place.primaryType),
        address: asString(place.formattedAddress),
        latitude,
        longitude,
        rating: asNumber(place.rating),
        review_count:
          typeof place.userRatingCount === "number" && Number.isFinite(place.userRatingCount)
            ? place.userRatingCount
            : null,
        business_status: asString(place.businessStatus),
        google_maps_uri: asString(place.googleMapsUri),
        phone: null,
        website: null,
        opening_hours: null,
      } satisfies LocalBusinessRecord;
    });

  return normalized.filter((record): record is LocalBusinessRecord => record !== null);
}

export function normalizeOpeningHours(
  hours: unknown,
): LocalBusinessOpeningHours | null {
  if (!hours || !isRecord(hours)) {
    return null;
  }

  const openNow = typeof hours.openNow === "boolean" ? hours.openNow : null;
  const weekdayDescriptions = Array.isArray(hours.weekdayDescriptions)
    ? hours.weekdayDescriptions.filter((value): value is string => typeof value === "string")
    : [];

  if (openNow === null && weekdayDescriptions.length === 0) {
    return null;
  }

  return {
    open_now: openNow,
    weekday_descriptions: weekdayDescriptions,
  };
}

export function mergePlaceDetails(
  results: LocalBusinessRecord[],
  detailsByPlaceId: Map<string, GooglePlaceDetailsLike>,
): LocalBusinessRecord[] {
  return results.map((result) => {
    const details = detailsByPlaceId.get(result.place_id);

    if (!details) {
      return result;
    }

    return {
      ...result,
      phone: asString(details.nationalPhoneNumber),
      website: asString(details.websiteUri),
      opening_hours: normalizeOpeningHours(details.currentOpeningHours),
    };
  });
}
