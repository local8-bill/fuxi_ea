"use server";

import { NextResponse } from "next/server";
import type { RiskPostureSample } from "@/lib/sequencer/types";
import { listRiskPostureSamples, persistRiskPostureSample } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RiskPostureSample;
    if (!isRiskPostureSample(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid risk posture payload" }, { status: 400 });
    }
    await persistRiskPostureSample(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save risk posture sample" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const samples = await listRiskPostureSamples(projectId);
    const filtered = sequenceId ? samples.filter((sample) => sample.sequenceId === sequenceId) : samples;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch risk posture samples" }, { status: 500 });
  }
}

function isRiskPostureSample(value: unknown): value is RiskPostureSample {
  if (!value || typeof value !== "object") return false;
  const sample = value as RiskPostureSample;
  if (!sample.projectId || !sample.sequenceId) return false;
  if (typeof sample.score !== "number" || typeof sample.confidence !== "number") return false;
  if (!sample.band || !sample.createdAt) return false;
  if (typeof sample.sampleSize !== "number") return false;
  return true;
}
