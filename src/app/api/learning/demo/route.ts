import { NextRequest, NextResponse } from "next/server";
import { readDemoMetrics } from "@/lib/change-intelligence/demoLearning";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "700am";
  const metrics = await readDemoMetrics(projectId);
  return NextResponse.json({
    projectId,
    confidence: metrics?.confidence ?? null,
    velocity: metrics?.velocity ?? null,
    maturity: metrics?.maturity ?? null,
    updatedAt: metrics?.updatedAt ?? null,
  });
}
