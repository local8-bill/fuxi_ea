"use server";

import { NextResponse } from "next/server";
import type { SequenceDraft } from "@/lib/sequencer/types";
import { listSequenceDrafts, persistSequenceDraft } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SequenceDraft;
    if (!isSequenceDraft(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid sequence draft payload" }, { status: 400 });
    }
    await persistSequenceDraft(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save sequence draft" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const drafts = await listSequenceDrafts(projectId);
    const filtered = sequenceId ? drafts.filter((draft) => draft.sequenceId === sequenceId) : drafts;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch sequence drafts" }, { status: 500 });
  }
}

function isSequenceDraft(value: unknown): value is SequenceDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as SequenceDraft;
  if (!draft.sequenceId || !draft.projectId || !draft.name || !draft.version) return false;
  if (!Array.isArray(draft.stages)) return false;
  if (draft.waves && !Array.isArray(draft.waves)) return false;
  return true;
}
