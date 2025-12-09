import { NextRequest, NextResponse } from "next/server";
import { getClassificationSummary } from "@/lib/inventory/classification";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "700am";
  const summary = await getClassificationSummary(projectId);
  return NextResponse.json({
    projectId,
    mix: summary.mix,
    definitions: summary.definitions,
  });
}
