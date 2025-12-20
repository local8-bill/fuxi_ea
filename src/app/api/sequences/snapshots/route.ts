"use server";

import { NextResponse } from "next/server";
import type { SequenceSnapshot } from "@/lib/sequencer/types";
import { listSequenceSnapshots, persistSequenceSnapshot } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SequenceSnapshot;
    if (!isSequenceSnapshot(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid sequence snapshot payload" }, { status: 400 });
    }
    await persistSequenceSnapshot(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save sequence snapshot" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const snapshots = await listSequenceSnapshots(projectId);
    const filtered = sequenceId ? snapshots.filter((entry) => entry.sequenceId === sequenceId) : snapshots;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch sequence snapshots" }, { status: 500 });
  }
}

function isSequenceSnapshot(value: unknown): value is SequenceSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as SequenceSnapshot;
  if (!snapshot.snapshotId || !snapshot.projectId || !snapshot.sequenceId) return false;
  if (!snapshot.version || !snapshot.createdAt || !snapshot.source) return false;
  if (!snapshot.sequence) return false;
  return true;
}
