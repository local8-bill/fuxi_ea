import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = (searchParams.get("project") ?? "").toString().trim();

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing project id" },
        { status: 400 },
      );
    }

    const stats = getStatsForProject(projectId);

    return NextResponse.json(
      {
        ok: true,
        stats,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("digital-enterprise/stats GET error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to compute stats" },
      { status: 500 },
    );
  }
}
