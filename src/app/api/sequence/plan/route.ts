import { NextRequest, NextResponse } from "next/server";
import { buildSequencerPlan } from "@/lib/sequencer/plan";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, platforms = [], strategy = "value" } = await req.json();
    const plan = buildSequencerPlan(Array.isArray(platforms) ? platforms : [], String(strategy));

    return NextResponse.json({
      status: "ok",
      projectId,
      strategy: plan.strategy,
      waves: plan.waves,
      telemetry: { event: "sequencing_generated", projectId, strategy: plan.strategy },
    });
  } catch (err: any) {
    console.error("[/api/sequence/plan] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
