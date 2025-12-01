import { NextResponse } from "next/server";
import { generateTransformationSequence, readTransformationSequence } from "@/domain/services/sequencer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const existing = await readTransformationSequence();
    if (existing) {
      return NextResponse.json({ ok: true, data: existing });
    }
    const generated = await generateTransformationSequence();
    return NextResponse.json({ ok: true, data: generated });
  } catch (err: any) {
    console.error("[SEQUENCER] GET failed", err);
    return NextResponse.json({ ok: false, error: err?.message || "Failed to generate sequence" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const generated = await generateTransformationSequence();
    return NextResponse.json({ ok: true, data: generated });
  } catch (err: any) {
    console.error("[SEQUENCER] POST failed", err);
    return NextResponse.json({ ok: false, error: err?.message || "Failed to generate sequence" }, { status: 500 });
  }
}
