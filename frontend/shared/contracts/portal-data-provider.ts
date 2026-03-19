import type {
  ApiKeyRecord,
  ApiProduct,
  BillingPack,
  EndpointFilter,
  EndpointSpec,
  PlaygroundMode,
  PlaygroundRunResult,
  StudioGenerationRecord,
  StudioGenerationSubmission,
  UsageLogRow,
  UsageSummary,
} from "@/shared/types/portal";

export interface PortalDataProvider {
  listProducts(): Promise<ApiProduct[]>;
  listEndpoints(filter?: EndpointFilter): Promise<EndpointSpec[]>;
  getEndpointBySlug(slug: string): Promise<EndpointSpec | null>;
  runPlayground(input: {
    slug: string;
    payload: Record<string, unknown>;
    mode?: PlaygroundMode;
  }): Promise<PlaygroundRunResult>;
  submitStudioPrompt(input: { prompt: string }): Promise<StudioGenerationSubmission>;
  getStudioGeneration(recordId: string): Promise<StudioGenerationRecord>;
  getUsageSummary(): Promise<UsageSummary>;
  listUsageLogs(): Promise<UsageLogRow[]>;
  listApiKeys(): Promise<ApiKeyRecord[]>;
  getBillingPacks(): Promise<BillingPack[]>;
}
