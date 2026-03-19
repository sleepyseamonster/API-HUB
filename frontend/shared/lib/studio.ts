import type { StudioGenerationRecord, StudioGenerationStatus } from "@/shared/types/portal";

interface AirtableAttachment {
  url?: unknown;
}

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getImageUrl(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const firstAttachment = value[0] as AirtableAttachment | undefined;
  return asString(firstAttachment?.url);
}

export function deriveStudioGenerationStatus(input: {
  refinedPrompt: string | null;
  imageUrl: string | null;
}): StudioGenerationStatus {
  if (input.imageUrl) {
    return "complete";
  }

  if (input.refinedPrompt) {
    return "generating";
  }

  return "refining";
}

export function normalizeStudioGenerationRecord(record: AirtableRecord): StudioGenerationRecord {
  const fields = record.fields ?? {};
  const prompt = asString(fields.Prompt) ?? "";
  const refinedPrompt = asString(fields["Refined Prompt"]);
  const imageUrl = getImageUrl(fields.Image);

  return {
    recordId: record.id,
    prompt,
    refinedPrompt,
    imageUrl,
    status: deriveStudioGenerationStatus({ refinedPrompt, imageUrl }),
  };
}
