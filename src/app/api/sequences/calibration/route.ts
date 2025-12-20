"use server";

import { NextResponse } from "next/server";
import type { CalibrationEvent } from "@/lib/sequencer/types";
import { listCalibrationEvents, persistCalibrationEvent } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CalibrationEvent;
    if (!isCalibrationEvent(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid calibration payload" }, { status: 400 });
    }
    await persistCalibrationEvent(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save calibration event" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const events = await listCalibrationEvents(projectId);
    const filtered = sequenceId ? events.filter((event) => event.sequenceId === sequenceId) : events;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch calibration events" }, { status: 500 });
  }
}

function isCalibrationEvent(value: unknown): value is CalibrationEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as CalibrationEvent;
  if (!event.calibrationId || !event.projectId || !event.sequenceId || !event.conflictId) return false;
  if (!event.userAction || typeof event.deltaSeverity !== "number") return false;
  if (!event.authoredBy || !event.createdAt) return false;
  return true;
}
