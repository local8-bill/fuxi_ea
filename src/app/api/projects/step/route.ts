import { NextResponse } from "next/server";
import { updateProjectStep, maybeAutoHarmonize } from "@/domain/services/projectFlow";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { projectId?: string; step?: string; status?: "active" | "complete" } | null;
    if (!body?.projectId || !body?.step || !body?.status) {
      return NextResponse.json({ ok: false, error: "Missing projectId, step, or status" }, { status: 400 });
    }
    const state = await updateProjectStep(body.projectId, body.step, body.status);
    if (body.step === "tech_stack" || body.step === "connections") {
      void maybeAutoHarmonize(body.projectId);
    }
    return NextResponse.json({ ok: true, state });
  } catch (err: any) {
    console.error("[PROJECT-STEP] failed", err);
    return NextResponse.json({ ok: false, error: "Failed to update step" }, { status: 500 });
  }
}
