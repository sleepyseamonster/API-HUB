import "server-only";

import { normalizeStudioGenerationRecord } from "@/shared/lib/studio";
import type { StudioGenerationRecord, StudioGenerationSubmission } from "@/shared/types/portal";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const DEFAULT_REFINER_AGENT_RECORD_ID = "rec5dYNZMCRfEgUAO";

interface AirtableCreateResponse {
  id?: unknown;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getStudioConfig() {
  return {
    airtablePat: getRequiredEnv("AIRTABLE_PAT"),
    airtableBaseId: getRequiredEnv("AIRTABLE_BASE_ID"),
    airtableWorkflowTableId: getRequiredEnv("AIRTABLE_WORKFLOW_TABLE_ID"),
    airtableRefinerAgentRecordId:
      process.env.AIRTABLE_REFINER_AGENT_RECORD_ID ?? DEFAULT_REFINER_AGENT_RECORD_ID,
    n8nGenerateWebhookUrl: getRequiredEnv("N8N_GENERATE_WEBHOOK_URL"),
  };
}

function getAirtableUrl(baseId: string, tableId: string, recordId?: string): string {
  const encodedTableId = encodeURIComponent(tableId);
  const encodedRecordId = recordId ? `/${encodeURIComponent(recordId)}` : "";

  return `${AIRTABLE_API_BASE}/${encodeURIComponent(baseId)}/${encodedTableId}${encodedRecordId}`;
}

async function airtableRequest<T>(
  path: string,
  init: RequestInit & { airtablePat: string },
): Promise<T> {
  const { airtablePat, headers, ...requestInit } = init;
  const response = await fetch(path, {
    ...requestInit,
    headers: {
      Authorization: `Bearer ${airtablePat}`,
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const airtableMessage =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : "Airtable request failed";

    throw new Error(airtableMessage);
  }

  return body as T;
}

export async function createStudioGeneration(prompt: string): Promise<StudioGenerationSubmission> {
  const config = getStudioConfig();
  const createResponse = await airtableRequest<AirtableCreateResponse>(
    getAirtableUrl(config.airtableBaseId, config.airtableWorkflowTableId),
    {
      airtablePat: config.airtablePat,
      method: "POST",
      body: JSON.stringify({
        fields: {
          Prompt: prompt,
          "✅ Choose Action": "Generate",
          Agents: [config.airtableRefinerAgentRecordId],
        },
      }),
    },
  );

  if (typeof createResponse.id !== "string" || !createResponse.id) {
    throw new Error("Airtable did not return a record id");
  }

  const webhookUrl = new URL(config.n8nGenerateWebhookUrl);
  webhookUrl.searchParams.set("recordId", createResponse.id);
  webhookUrl.searchParams.set("action", "Generate");

  const webhookResponse = await fetch(webhookUrl, {
    method: "POST",
    cache: "no-store",
  });

  if (!webhookResponse.ok) {
    const responseText = await webhookResponse.text().catch(() => "");
    throw new Error(
      `n8n webhook trigger failed (${webhookResponse.status} ${webhookResponse.statusText})${
        responseText ? `: ${responseText}` : ""
      }`,
    );
  }

  return {
    recordId: createResponse.id,
    status: "queued",
  };
}

export async function fetchStudioGeneration(recordId: string): Promise<StudioGenerationRecord> {
  const config = getStudioConfig();
  const record = await airtableRequest<{ id: string; fields?: Record<string, unknown> }>(
    getAirtableUrl(config.airtableBaseId, config.airtableWorkflowTableId, recordId),
    {
      airtablePat: config.airtablePat,
      method: "GET",
    },
  );

  return normalizeStudioGenerationRecord(record);
}
