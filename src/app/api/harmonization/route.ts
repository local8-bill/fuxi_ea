import { NextRequest, NextResponse } from "next/server";
import { loadHarmonizationSummary } from "@/lib/harmonization/summary";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, platforms = [] } = await req.json();
    const filters = Array.isArray(platforms) ? platforms : [];
    const summary = await loadHarmonizationSummary(filters);

    const transitionUrl = projectId ? `/project/${projectId}/digital-enterprise` : "/project/demo/digital-enterprise";

    return NextResponse.json({
      status: "ok",
      summary,
      transitionUrl,
    });
  } catch (err: any) {
    console.error("[/api/harmonization] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
