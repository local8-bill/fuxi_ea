import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
import { normalizeSystemName } from "@/domain/services/systemNormalization";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: "de-systems" });

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project") ?? "";

    if (!projectId) {
      return jsonError(400, "Missing project param");
    }

    // ✅ THIS WAS THE BUG: we need to await
    const stats = await getStatsForProject(projectId);
    const rawTop = (stats as any)?.topSystems ?? [];

    const systems = (rawTop as any[]).map((s, idx) => {
      const rawName =
        s?.systemName ??
        s?.name ??
        s?.label ??
        s?.id ??
        s?.systemId ??
        "Unknown";

      const normalizedName = normalizeSystemName(rawName);
      const integrationCount = (s?.integrationCount ??
        s?.integrations ??
        s?.degree ??
        0) as number;

      return {
        id: s?.systemId ?? s?.id ?? String(idx),
        rawName,
        name: rawName,
        normalizedName,
        integrationCount,
      };
    });

    console.log("[DE-SYSTEMS] GET success", {
      projectId,
      systems: systems.length,
    });

    return NextResponse.json({
      ok: true,
      projectId,
      systems,
    });
  } catch (err: any) {
    console.error("[DE-SYSTEMS] GET error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Failed to load diagram systems",
        systems: [],
      },
      { status: 500 },
    );
  }
}
