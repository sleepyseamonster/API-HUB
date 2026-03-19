import { apiProducts, endpointBySlug, endpointRegistry } from "@/entities/endpoints/model/endpoint-registry";
import { filterEndpoints } from "@/entities/endpoints/model/search";
import type { PortalDataProvider } from "@/shared/contracts/portal-data-provider";
import type {
  ApiKeyRecord,
  BillingPack,
  EndpointFilter,
  PlaygroundMode,
  PlaygroundRunResult,
  StudioGenerationRecord,
  StudioGenerationSubmission,
  UsageLogRow,
  UsageSummary,
} from "@/shared/types/portal";

const usageSummary: UsageSummary = {
  totalCalls: 12844,
  successRate: 98.4,
  creditsRemaining: 2410,
  creditsUsedThisMonth: 928,
};

const usageLogs: UsageLogRow[] = [
  {
    id: "log_1",
    endpointSlug: "scrape-website",
    method: "POST",
    path: "/v1/tools/scrape-website",
    statusCode: 200,
    latencyMs: 542,
    creditsSpent: 3,
    timestampIso: "2026-03-11T17:19:00.000Z",
  },
  {
    id: "log_2",
    endpointSlug: "knowledge-base-search",
    method: "GET",
    path: "/v1/knowledge-base/search",
    statusCode: 200,
    latencyMs: 211,
    creditsSpent: 2,
    timestampIso: "2026-03-11T17:16:00.000Z",
  },
  {
    id: "log_3",
    endpointSlug: "analyze-doc",
    method: "POST",
    path: "/v1/tools/analyze-doc",
    statusCode: 422,
    latencyMs: 335,
    creditsSpent: 0,
    timestampIso: "2026-03-11T17:03:00.000Z",
  },
  {
    id: "log_4",
    endpointSlug: "lead-enrichment",
    method: "POST",
    path: "/v1/tools/lead-enrichment",
    statusCode: 200,
    latencyMs: 748,
    creditsSpent: 5,
    timestampIso: "2026-03-11T16:48:00.000Z",
  },
];

const apiKeys: ApiKeyRecord[] = [
  {
    id: "key_1",
    name: "Sandbox Main",
    prefix: "hub_sb_8g42",
    environment: "sandbox",
    createdAtIso: "2026-01-11T00:00:00.000Z",
    lastUsedAtIso: "2026-03-11T17:19:00.000Z",
    revoked: false,
  },
  {
    id: "key_2",
    name: "Production Primary",
    prefix: "hub_pr_9k17",
    environment: "production",
    createdAtIso: "2026-02-02T00:00:00.000Z",
    lastUsedAtIso: "2026-03-11T16:48:00.000Z",
    revoked: false,
  },
  {
    id: "key_3",
    name: "Legacy Integration",
    prefix: "hub_pr_2d80",
    environment: "production",
    createdAtIso: "2025-12-10T00:00:00.000Z",
    lastUsedAtIso: "2026-02-20T11:31:00.000Z",
    revoked: true,
  },
];

const billingPacks: BillingPack[] = [
  { id: "starter", name: "Starter", credits: 1000, priceUsd: 49 },
  { id: "growth", name: "Growth", credits: 5000, priceUsd: 199, popular: true },
  { id: "scale", name: "Scale", credits: 15000, priceUsd: 499 },
];

async function fetchStudio<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Studio request failed");
  }

  return body as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldError(mode: PlaygroundMode): boolean {
  if (mode === "error") {
    return true;
  }
  if (mode === "success") {
    return false;
  }
  return Math.random() < 0.25;
}

function randomLatency(): number {
  return Math.floor(180 + Math.random() * 720);
}

function getResponse(slug: string): Record<string, unknown> {
  return endpointBySlug.get(slug)?.responseExample ?? { status: "error", data: {}, message: "Unknown endpoint" };
}

export function createMockPortalDataProvider(): PortalDataProvider {
  return {
    async listProducts() {
      await delay(40);
      return apiProducts;
    },

    async listEndpoints(filter?: EndpointFilter) {
      await delay(40);
      return filterEndpoints(endpointRegistry, filter);
    },

    async getEndpointBySlug(slug: string) {
      await delay(20);
      return endpointBySlug.get(slug) ?? null;
    },

    async runPlayground({ slug, payload, mode = "random" }) {
      const latencyMs = randomLatency();
      await delay(latencyMs);

      if (!endpointBySlug.has(slug)) {
        return {
          status: "error",
          statusCode: 404,
          latencyMs,
          message: "Endpoint not found",
          body: {
            status: "error",
            message: "Unknown endpoint slug",
            data: { slug },
          },
        } satisfies PlaygroundRunResult;
      }

      if (shouldError(mode)) {
        return {
          status: "error",
          statusCode: 422,
          latencyMs,
          message: "Validation error",
          body: {
            status: "error",
            message: "Request failed validation in mock simulation",
            data: {
              received: payload,
            },
          },
        } satisfies PlaygroundRunResult;
      }

      return {
        status: "success",
        statusCode: 200,
        latencyMs,
        message: "Request completed",
        body: {
          ...getResponse(slug),
          meta: {
            simulated: true,
            received: payload,
          },
        },
      } satisfies PlaygroundRunResult;
    },

    async submitStudioPrompt(input) {
      return fetchStudio<StudioGenerationSubmission>("/api/studio/generations", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    async getStudioGeneration(recordId) {
      return fetchStudio<StudioGenerationRecord>(`/api/studio/generations/${recordId}`);
    },

    async getUsageSummary() {
      await delay(20);
      return usageSummary;
    },

    async listUsageLogs() {
      await delay(40);
      return usageLogs;
    },

    async listApiKeys() {
      await delay(20);
      return apiKeys;
    },

    async getBillingPacks() {
      await delay(20);
      return billingPacks;
    },
  };
}
