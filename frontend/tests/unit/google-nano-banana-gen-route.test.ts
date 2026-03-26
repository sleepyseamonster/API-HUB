import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/v1/tools/google-nano-banana-gen/route";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

describe("google nano banana gen live route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates an Airtable record and triggers the generation webhook", async () => {
    vi.stubEnv("AIRTABLE_PAT", "pat_test");
    vi.stubEnv("AIRTABLE_BASE_ID", "app_test");
    vi.stubEnv("AIRTABLE_WORKFLOW_TABLE_ID", "tbl_test");
    vi.stubEnv("AIRTABLE_REFINER_AGENT_RECORD_ID", "rec_agent");
    vi.stubEnv(
      "N8N_GENERATE_WEBHOOK_URL",
      "https://sleepyseamonster.app.n8n.cloud/webhook/2ca77f7d-033f-4e3e-b253-6a28b0996473",
    );

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "https://api.airtable.com/v0/app_test/tbl_test") {
        expect(init).toMatchObject({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer pat_test",
          }),
        });

        return jsonResponse({ id: "recNanoBanana123" });
      }

      if (
        url ===
        "https://sleepyseamonster.app.n8n.cloud/webhook/2ca77f7d-033f-4e3e-b253-6a28b0996473?recordId=recNanoBanana123&action=Generate"
      ) {
        return jsonResponse({ ok: true });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    const request = new Request("http://localhost/v1/tools/google-nano-banana-gen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "A banana-shaped nano drone over a desert observatory",
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body).toMatchObject({
      status: "success",
      message: "Generation queued.",
      data: {
        record_id: "recNanoBanana123",
        status: "queued",
      },
    });
  });

  it("returns validation errors when prompt is missing", async () => {
    const request = new Request("http://localhost/v1/tools/google-nano-banana-gen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "error",
      message: "`prompt` is required.",
      error: {
        code: "validation_error",
        retryable: false,
      },
    });
  });
});
