export class TranscriptIngestUpstreamError extends Error {
  details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "TranscriptIngestUpstreamError";
    this.details = details;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getTranscriptWebhookConfig() {
  return {
    webhookUrl: getRequiredEnv("N8N_TRANSCRIPT_WEBHOOK_URL"),
    authHeader: process.env.N8N_TRANSCRIPT_WEBHOOK_AUTH_HEADER ?? null,
    authToken: process.env.N8N_TRANSCRIPT_WEBHOOK_AUTH_TOKEN ?? null,
  };
}

export async function sendTranscriptToWebhook(args: {
  file: File;
  batchId: string;
  sourceFilename: string;
  sourceRelativePath: string;
  fingerprint: string;
  droppedAt: string;
  contentType: string;
}) {
  const config = getTranscriptWebhookConfig();
  const formData = new FormData();
  formData.set("batch_id", args.batchId);
  formData.set("source_filename", args.sourceFilename);
  formData.set("source_relative_path", args.sourceRelativePath);
  formData.set("fingerprint", args.fingerprint);
  formData.set("dropped_at", args.droppedAt);
  formData.set("content_type", args.contentType);
  formData.set("file", args.file, args.sourceFilename);

  const headers: HeadersInit = {};

  if (config.authHeader && config.authToken) {
    headers[config.authHeader] = config.authToken;
  }

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new TranscriptIngestUpstreamError("Transcript ingest webhook failed.", {
      status: response.status,
      statusText: response.statusText,
      body: body ?? {},
    });
  }

  return body ?? {};
}
