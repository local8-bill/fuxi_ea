"use server";

import { NextResponse } from "next/server";
import type { ScenarioDraft } from "@/lib/sequencer/types";
import { listScenarioDrafts, persistScenarioDraft } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as ScenarioDraft;
    if (!isScenarioDraft(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid scenario draft payload" }, { status: 400 });
    }
    await persistScenarioDraft(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save scenario draft" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const scenarioId = searchParams.get("scenarioId") ?? undefined;
    const drafts = await listScenarioDrafts(projectId);
    const filtered = scenarioId ? drafts.filter((draft) => draft.scenarioId === scenarioId) : drafts;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch scenario drafts" }, { status: 500 });
  }
}

function isScenarioDraft(value: unknown): value is ScenarioDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as ScenarioDraft;
  if (!draft.projectId || !draft.scenarioId || !draft.name || !draft.targetOutcome) return false;
  if (!draft.scope || !Array.isArray(draft.scope.regions) || !Array.isArray(draft.scope.brands) || !Array.isArray(draft.scope.channels)) return false;
  if (!draft.constraints) return false;
  if (!Array.isArray(draft.assumptions)) return false;
  if (!draft.createdBy || !draft.createdAt) return false;
  return true;
}
