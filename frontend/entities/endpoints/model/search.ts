import type { EndpointFilter, EndpointSpec } from "@/shared/types/portal";

export function normalizeQuery(raw?: string): string {
  return (raw ?? "").trim().toLowerCase();
}

export function filterEndpoints(
  endpoints: EndpointSpec[],
  filter?: EndpointFilter,
): EndpointSpec[] {
  const query = normalizeQuery(filter?.query);
  const category = filter?.category ?? "all";

  return endpoints.filter((endpoint) => {
    if (category !== "all" && endpoint.category !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      endpoint.title,
      endpoint.path,
      endpoint.summary,
      endpoint.description,
      endpoint.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
