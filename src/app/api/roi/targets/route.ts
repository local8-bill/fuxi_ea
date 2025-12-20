"use server";

import { NextResponse } from "next/server";
import type { RoiTargets } from "@/lib/roi/types";
import { listRoiTargets, persistRoiTargets } from "@/lib/roi/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RoiTargets;
    if (!isRoiTargets(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid ROI targets payload" }, { status: 400 });
    }
    await persistRoiTargets(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save ROI targets" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const records = await listRoiTargets(projectId);
    const filtered = sequenceId ? records.filter((entry) => entry.sequenceId === sequenceId) : records;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch ROI targets" }, { status: 500 });
  }
}

function isRoiTargets(value: unknown): value is RoiTargets {
  if (!value || typeof value !== "object") return false;
  const targets = value as RoiTargets;
  if (!targets.targetId || !targets.projectId) return false;
  if (!targets.createdAt) return false;
  return true;
}
