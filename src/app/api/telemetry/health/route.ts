"use server";

import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const EVENTS_FILE = path.join(process.cwd(), ".fuxi", "data", "telemetry_events.ndjson");

export async function GET() {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8").catch(() => "");
    const count = raw ? raw.trim().split("\n").filter(Boolean).length : 0;
    return NextResponse.json({ ok: true, telemetry_events: count });
  } catch (err: any) {
    console.error("[TELEMETRY] Health check failed", err);
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 500 });
  }
}
