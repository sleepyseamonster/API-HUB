import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  LocalBusinessSearchValidationError,
  validateLocalBusinessSearchInput,
} from "@/shared/lib/local-business-search";
import {
  ensurePreviewEnabled,
  PreviewDisabledError,
  runLocalBusinessSearch,
  UpstreamRequestError,
} from "@/app/api/playground/local-business-search/_lib/local-business-search-server";

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
    ensurePreviewEnabled();
    const body = (await request.json().catch(() => null)) as unknown;
    const input = validateLocalBusinessSearchInput(body);
    const results = await runLocalBusinessSearch(input);

    return NextResponse.json({
      status: "success",
      data: {
        query: input.query,
        location: input.location,
        results,
      },
      message: "Search complete",
      meta: {
        request_id: requestId,
        preview: true,
      },
    });
  } catch (error) {
    if (error instanceof PreviewDisabledError) {
      return errorResponse({
        statusCode: 403,
        message: error.message,
        code: "forbidden",
        retryable: false,
        requestId,
      });
    }

    if (error instanceof LocalBusinessSearchValidationError) {
      return errorResponse({
        statusCode: 422,
        message: error.message,
        code: "validation_error",
        retryable: false,
        requestId,
      });
    }

    if (error instanceof UpstreamRequestError) {
      return errorResponse({
        statusCode: 502,
        message: error.message,
        code: "upstream_error",
        retryable: true,
        requestId,
        details: error.details,
      });
    }

    console.error("Local business search preview failed", error);
    const message = error instanceof Error ? error.message : "Local business search preview failed.";

    return errorResponse({
      statusCode: 500,
      message,
      code: "internal_error",
      retryable: false,
      requestId,
    });
  }
}
