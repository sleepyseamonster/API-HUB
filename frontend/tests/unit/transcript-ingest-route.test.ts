import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/v1/tools/transcript-ingest/route";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

describe("transcript ingest live route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uploads a transcript file to the n8n webhook", async () => {
    vi.stubEnv(
      "N8N_TRANSCRIPT_WEBHOOK_URL",
      "https://sleepyseamonster.app.n8n.cloud/webhook/transcript-hot-folder-intake",
    );

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        status: "success",
        message: "Processing completed.",
        chunks_generated: 8,
        chunks_inserted: 8,
      }),
    );

    const formData = new FormData();
    formData.set("file", new File(["hello world"], "lesson.txt", { type: "text/plain" }));
    const request = {
      formData: async () => formData,
    } as Request;

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sleepyseamonster.app.n8n.cloud/webhook/transcript-hot-folder-intake",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(body).toMatchObject({
      status: "success",
      message: "Processing completed.",
      data: {
        source_filename: "lesson.txt",
        source_relative_path: "lesson.txt",
      },
    });
  });

  it("returns validation errors for unsupported uploads", async () => {
    vi.stubEnv(
      "N8N_TRANSCRIPT_WEBHOOK_URL",
      "https://sleepyseamonster.app.n8n.cloud/webhook/transcript-hot-folder-intake",
    );

    const formData = new FormData();
    formData.set("file", new File(["%PDF"], "lesson.pdf", { type: "application/pdf" }));
    const request = {
      formData: async () => formData,
    } as Request;

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "error",
      error: {
        code: "validation_error",
        retryable: false,
      },
    });
  });
});
