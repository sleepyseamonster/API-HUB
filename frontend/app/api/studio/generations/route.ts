import { NextResponse } from "next/server";
import { createStudioGeneration } from "@/app/api/studio/generations/_lib/studio-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { prompt?: unknown } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const submission = await createStudioGeneration(prompt);
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Failed to create studio generation", error);
    const message = error instanceof Error ? error.message : "Failed to create generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
