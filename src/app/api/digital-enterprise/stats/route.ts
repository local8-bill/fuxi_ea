import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: "de-stats" });

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") ?? "default";

  console.log("[DE-STATS] GET start", { projectId });

  try {
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

    return jsonError(
      500,
      "Failed to compute digital enterprise stats",
      err?.message ?? "Unknown error",
    );
  }
}
