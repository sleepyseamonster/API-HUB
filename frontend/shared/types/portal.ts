export type HttpMethod = "GET" | "POST";

export type EndpointCategory = "resource" | "automation";

export type PlaygroundMode = "success" | "error" | "random";

export type RunStatus = "success" | "error";

export type KeyEnvironment = "sandbox" | "production";

export type RequestState = "success" | "error" | "running" | "idle";

export type StudioGenerationStatus =
  | "queued"
  | "refining"
  | "generating"
  | "complete"
  | "error";

export interface PlaygroundExample {
  name: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface EndpointSpec {
  slug: string;
  title: string;
  path: string;
  method: HttpMethod;
  category: EndpointCategory;
  summary: string;
  description: string;
  creditsPerCall: number;
  tags: string[];
  requestExample: PlaygroundExample;
  responseExample: Record<string, unknown>;
}

export interface ApiProduct {
  id: string;
  name: string;
  summary: string;
  category: EndpointCategory;
  endpointSlugs: string[];
}

export interface CodeSnippet {
  language: "curl" | "javascript" | "python" | "ruby";
  content: string;
}

export interface UsageSummary {
  totalCalls: number;
  successRate: number;
  creditsRemaining: number;
  creditsUsedThisMonth: number;
}

export interface UsageLogRow {
  id: string;
  endpointSlug: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  latencyMs: number;
  creditsSpent: number;
  timestampIso: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  environment: KeyEnvironment;
  createdAtIso: string;
  lastUsedAtIso: string;
  revoked: boolean;
}

export interface BillingPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
}

export interface PlaygroundRunResult {
  status: RunStatus;
  statusCode: number;
  latencyMs: number;
  body: Record<string, unknown>;
  message: string;
}

export interface EndpointFilter {
  query?: string;
  category?: EndpointCategory | "all";
}

export interface StudioGenerationSubmission {
  recordId: string;
  status: "queued";
}

export interface StudioGenerationRecord {
  recordId: string;
  prompt: string;
  refinedPrompt: string | null;
  imageUrl: string | null;
  status: StudioGenerationStatus;
}
