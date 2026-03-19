import { NextResponse } from "next/server";
import { fetchStudioGeneration } from "@/app/api/studio/generations/_lib/studio-server";

export const dynamic = "force-dynamic";

interface StudioGenerationRouteProps {
  params: Promise<{ recordId: string }>;
}

export async function GET(_: Request, { params }: StudioGenerationRouteProps) {
  try {
    const { recordId } = await params;
    const generation = await fetchStudioGeneration(recordId);
    return NextResponse.json(generation);
  } catch (error) {
    console.error("Failed to fetch studio generation", error);
    const message = error instanceof Error ? error.message : "Failed to fetch generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
