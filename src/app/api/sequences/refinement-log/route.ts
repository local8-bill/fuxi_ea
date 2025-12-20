"use server";

import { NextResponse } from "next/server";
import type { RefinementLogEntry } from "@/lib/sequencer/types";
import { listRefinementLogEntries, persistRefinementLogEntry } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RefinementLogEntry;
    if (!isRefinementLogEntry(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid refinement log payload" }, { status: 400 });
    }
    await persistRefinementLogEntry(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save refinement log entry" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const entries = await listRefinementLogEntries(projectId);
    const filtered = sequenceId ? entries.filter((entry) => entry.sequenceId === sequenceId) : entries;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch refinement log entries" }, { status: 500 });
  }
}

function isRefinementLogEntry(value: unknown): value is RefinementLogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as RefinementLogEntry;
  if (!entry.logId || !entry.sequenceId || !entry.action || !entry.message) return false;
  if (!entry.authoredBy || !entry.createdAt) return false;
  return true;
}
