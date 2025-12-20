"use server";

import { NextResponse } from "next/server";
import type { RoiAssumptions } from "@/lib/roi/types";
import { listRoiAssumptions, persistRoiAssumptions } from "@/lib/roi/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RoiAssumptions;
    if (!isRoiAssumptions(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid ROI assumptions payload" }, { status: 400 });
    }
    await persistRoiAssumptions(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save ROI assumptions" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const records = await listRoiAssumptions(projectId);
    const filtered = sequenceId ? records.filter((entry) => entry.sequenceId === sequenceId) : records;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch ROI assumptions" }, { status: 500 });
  }
}

function isRoiAssumptions(value: unknown): value is RoiAssumptions {
  if (!value || typeof value !== "object") return false;
  const assumptions = value as RoiAssumptions;
  if (!assumptions.assumptionsId || !assumptions.projectId) return false;
  if (!assumptions.createdAt) return false;
  return true;
}
