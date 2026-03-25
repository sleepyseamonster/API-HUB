import "server-only";

export { UpstreamRequestError } from "@/shared/lib/local-business-search-runtime";
export { runLocalBusinessSearch } from "@/shared/lib/local-business-search-runtime";

export class PreviewDisabledError extends Error {
  constructor() {
    super("Local Business Search preview is disabled.");
    this.name = "PreviewDisabledError";
  }
}

export function ensurePreviewEnabled(): void {
  if (process.env.LOCAL_BUSINESS_SEARCH_PREVIEW_ENABLED !== "true") {
    throw new PreviewDisabledError();
  }
}
