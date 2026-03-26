import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildTranscriptDemoMetadata,
  computeTranscriptFingerprint,
  TranscriptIngestValidationError,
  validateTranscriptUploadFile,
} from "@/shared/lib/transcript-ingest";
import {
  sendTranscriptToWebhook,
  TranscriptIngestUpstreamError,
} from "@/shared/lib/transcript-ingest-runtime";

export const dynamic = "force-dynamic";

function errorResponse(args: {
  statusCode: number;
  message: string;
  code: string;
  retryable: boolean;
  requestId: string;
  details?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      status: "error",
      data: {},
      message: args.message,
      error: {
        code: args.code,
        retryable: args.retryable,
        request_id: args.requestId,
        details: args.details ?? {},
      },
    },
    { status: args.statusCode },
  );
}

export async function POST(request: Request) {
  const requestId = `req_${randomUUID()}`;

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file =
      fileValue &&
      typeof fileValue === "object" &&
      "name" in fileValue &&
      "arrayBuffer" in fileValue
        ? validateTranscriptUploadFile(fileValue as File)
        : validateTranscriptUploadFile(null);
    const metadata = buildTranscriptDemoMetadata(file);
    const fingerprint = await computeTranscriptFingerprint(file);
    const webhookResponse = await sendTranscriptToWebhook({
      file,
      batchId: metadata.batchId,
      sourceFilename: metadata.sourceFilename,
      sourceRelativePath: metadata.sourceRelativePath,
      fingerprint,
      droppedAt: metadata.droppedAt,
      contentType: metadata.contentType,
    });

    return NextResponse.json({
      status: "success",
      data: {
        batch_id: metadata.batchId,
        source_filename: metadata.sourceFilename,
        source_relative_path: metadata.sourceRelativePath,
        fingerprint,
        upstream: webhookResponse,
      },
      message:
        typeof webhookResponse.message === "string"
          ? webhookResponse.message
          : "Transcript received for processing.",
      meta: {
        request_id: requestId,
        demo: true,
      },
    });
  } catch (error) {
    if (error instanceof TranscriptIngestValidationError) {
      return errorResponse({
        statusCode: 422,
        message: error.message,
        code: "validation_error",
        retryable: false,
        requestId,
      });
    }

    if (error instanceof TranscriptIngestUpstreamError) {
      return errorResponse({
        statusCode: 502,
        message: error.message,
        code: "upstream_error",
        retryable: true,
        requestId,
        details: error.details,
      });
    }

    console.error("Transcript ingest live route failed", error);
    const message = error instanceof Error ? error.message : "Transcript ingest failed.";

    return errorResponse({
      statusCode: 500,
      message,
      code: "internal_error",
      retryable: false,
      requestId,
    });
  }
}
