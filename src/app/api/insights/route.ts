import { NextResponse } from "next/server";
import type { Opportunity } from "@/domain/knowledge";
import { computeInsights } from "@/controllers/insightController";
import { loadInsightsServer, computeAndPersist } from "@/controllers/insightServer";

export async function GET() {
  try {
    const data = await loadInsightsServer();
    return NextResponse.json({ ok: true, opportunities: data });
  } catch (err) {
    console.error("[INSIGHTS API] GET failed", err);
    return NextResponse.json({ ok: false, opportunities: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputs = Array.isArray(body?.inputs) ? body.inputs : [];
    const opportunities: Opportunity[] = await computeAndPersist(inputs);
    return NextResponse.json({ ok: true, opportunities });
  } catch (err) {
    console.error("[INSIGHTS API] POST failed", err);
    return NextResponse.json({ ok: false, error: "Failed to compute insights" }, { status: 500 });
  }
}
