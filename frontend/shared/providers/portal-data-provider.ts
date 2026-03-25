import { createMockPortalDataProvider } from "@/shared/providers/mock-portal-data-provider";
import { getPreviewRouteForEndpoint, isPreviewBackedEndpoint } from "@/shared/lib/endpoint-runtime";
import type { PlaygroundRunResult } from "@/shared/types/portal";

const mockProvider = createMockPortalDataProvider();

async function runPreviewBackedPlayground(args: {
  slug: string;
  payload: Record<string, unknown>;
}): Promise<PlaygroundRunResult> {
  const route = getPreviewRouteForEndpoint(args.slug);

  if (!route) {
    throw new Error(`No preview route configured for endpoint: ${args.slug}`);
  }

  const startedAt = Date.now();
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.payload),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const latencyMs = Date.now() - startedAt;
  const message =
    body && typeof body.message === "string"
      ? body.message
      : response.ok
        ? "Request completed"
        : "Request failed";

  return {
    status: response.ok ? "success" : "error",
    statusCode: response.status,
    latencyMs,
    message,
    body:
      body ??
      ({
        status: "error",
        data: {},
        message,
      } satisfies Record<string, unknown>),
  };
}

export function createPortalDataProvider() {
  return {
    ...mockProvider,
    async runPlayground(input: {
      slug: string;
      payload: Record<string, unknown>;
      mode?: "success" | "error" | "random";
    }) {
      if (isPreviewBackedEndpoint(input.slug)) {
        return runPreviewBackedPlayground(input);
      }

      return mockProvider.runPlayground(input);
    },
  };
}

export const portalDataProvider = createPortalDataProvider();
