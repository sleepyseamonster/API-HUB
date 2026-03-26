import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createStudioGeneration } from "@/app/api/studio/generations/_lib/studio-server";

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
    const body = (await request.json().catch(() => null)) as { prompt?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return errorResponse({
        statusCode: 422,
        message: "`prompt` is required.",
        code: "validation_error",
        retryable: false,
        requestId,
      });
    }

    const submission = await createStudioGeneration(prompt);

    return NextResponse.json({
      status: "success",
      data: {
        record_id: submission.recordId,
        status: submission.status,
      },
      message: "Generation queued.",
      meta: {
        request_id: requestId,
        demo: true,
      },
    });
  } catch (error) {
    console.error("Google Nano Banana Gen live route failed", error);
    const message = error instanceof Error ? error.message : "Generation failed.";

    return errorResponse({
      statusCode: 500,
      message,
      code: "internal_error",
      retryable: false,
      requestId,
    });
  }
}
