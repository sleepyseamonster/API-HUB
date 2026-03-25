const previewBackedEndpointSlugs = new Set(["local-business-search"]);

export function isPreviewBackedEndpoint(slug: string): boolean {
  return previewBackedEndpointSlugs.has(slug);
}

export function getPreviewRouteForEndpoint(slug: string): string | null {
  if (slug === "local-business-search") {
    return "/api/playground/local-business-search";
  }

  return null;
}
