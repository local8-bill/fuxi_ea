"use server";

import { NextResponse } from "next/server";
import type { ConflictSet } from "@/lib/sequencer/types";
import { listConflictSets, persistConflictSet } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as ConflictSet;
    if (!isConflictSet(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid conflict set payload" }, { status: 400 });
    }
    await persistConflictSet(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save conflict set" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const sets = await listConflictSets(projectId);
    const filtered = sequenceId ? sets.filter((set) => set.sequenceId === sequenceId) : sets;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch conflict sets" }, { status: 500 });
  }
}

function isConflictSet(value: unknown): value is ConflictSet {
  if (!value || typeof value !== "object") return false;
  const set = value as ConflictSet;
  if (!set.projectId || !set.sequenceId || !set.generatedAt || !set.rulesVersion) return false;
  if (!Array.isArray(set.conflicts)) return false;
  return true;
}
