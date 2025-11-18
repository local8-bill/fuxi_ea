import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project") ?? "";

    console.log("[DE-SYSTEMS] GET start", { projectId });

    if (!projectId) {
      console.warn("[DE-SYSTEMS] Missing project query param");
      return NextResponse.json(
        {
          ok: false,
          error: "Missing project id",
        },
        { status: 400 },
      );
    }

    const stats = getStatsForProject(projectId);

    // We expect internal stats.topSystems to be an array when available
    const rawTopSystems = (stats as any)?.topSystems;

    let systems: { id: string; name: string }[] = [];

    if (Array.isArray(rawTopSystems)) {
      systems = rawTopSystems.map((s: any, idx: number) => ({
        id:
          s?.systemId ??
          s?.id ??
          String(idx),
        name:
          s?.systemName ??
          s?.name ??
          s?.label ??
          s?.id ??
          "Unknown",
      }));
    }

    console.log("[DE-SYSTEMS] GET success", {
      projectId,
      systemCount: systems.length,
    });

    return NextResponse.json({
      ok: true,
      projectId,
      systemCount: systems.length,
      systems,
    });
  } catch (err: any) {
    console.error("[DE-SYSTEMS] GET error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load diagram systems",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
