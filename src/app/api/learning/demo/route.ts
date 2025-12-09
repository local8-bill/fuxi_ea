import { NextRequest, NextResponse } from "next/server";
import { getLearningState } from "@/lib/learning/persistence";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "700am";
  const state = await getLearningState(projectId);
  return NextResponse.json({
    projectId,
    confidence: state?.metrics?.confidence ?? null,
    velocity: state?.metrics?.velocity ?? null,
    maturity: state?.metrics?.maturity ?? null,
    updatedAt: state?.updatedAt ?? null,
  });
}
