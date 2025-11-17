import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") ?? "default";

  console.log("[DE-STATS] GET start", { projectId });

  try {
    // CRITICAL: await the async stats function
    const stats = await getStatsForProject(projectId);

    console.log("[DE-STATS] GET success", {
      projectId,
      systemsFuture: stats.systemsFuture,
      integrationsFuture: stats.integrationsFuture,
      topSystems: stats.topSystems?.length ?? 0,
    });

    return NextResponse.json(stats, { status: 200 });
  } catch (err: any) {
    console.error("[DE-STATS] GET error", {
      projectId,
      message: err?.message ?? String(err),
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        error: "Failed to compute digital enterprise stats",
        detail: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
