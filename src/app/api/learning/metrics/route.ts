import { NextRequest, NextResponse } from "next/server";
import { getLearningState } from "@/lib/learning/persistence";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "700am";
  const state = await getLearningState(projectId);
  return NextResponse.json({
    projectId,
    metrics: state?.metrics ?? null,
    narrative: state?.narrative ?? null,
    completedWaves: state?.completedWaves ?? 0,
    totalWaves: state?.totalWaves ?? 0,
    updatedAt: state?.updatedAt ?? null,
  });
}
