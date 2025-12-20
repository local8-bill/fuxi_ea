"use server";

import { NextResponse } from "next/server";
import type { DecisionLogEntry } from "@/lib/sequencer/types";
import { listDecisionLogEntries, persistDecisionLogEntry } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as DecisionLogEntry;
    if (!isDecisionLogEntry(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid decision log payload" }, { status: 400 });
    }
    await persistDecisionLogEntry(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save decision log" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const decisions = await listDecisionLogEntries(projectId);
    const filtered = sequenceId ? decisions.filter((entry) => entry.sequenceId === sequenceId) : decisions;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch decision log" }, { status: 500 });
  }
}

function isDecisionLogEntry(value: unknown): value is DecisionLogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as DecisionLogEntry;
  if (!entry.decisionId || !entry.projectId || !entry.sequenceId || !entry.title) return false;
  if (!entry.decisionType || !entry.owner || !entry.timestamp) return false;
  if (!Array.isArray(entry.options) || entry.options.length === 0) return false;
  if (!entry.selectedOption) return false;
  return true;
}
