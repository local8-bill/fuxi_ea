import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "src", "data", "ale");
const LOG_FILE = path.join(DATA_DIR, "logs.json");

type LearningEvent = {
  code?: string;
  details?: Record<string, unknown>;
  phase?: string;
  region?: string;
  node_id?: string;
};

function validateEvent(event: LearningEvent) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.code !== "string" || event.code.length === 0) return false;
  return true;
}

async function readLog() {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLog(entries: unknown[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(entries, null, 2));
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => null)) as LearningEvent | null;
    if (!payload || !validateEvent(payload)) {
      return NextResponse.json({ success: false, error: "Invalid learning event" }, { status: 400 });
    }
    const entry = {
      id: uuidv4(),
      code: payload.code,
      details: payload.details ?? {},
      phase: payload.phase ?? null,
      region: payload.region ?? null,
      node_id: payload.node_id ?? null,
      timestamp: new Date().toISOString(),
    };
    const existing = await readLog();
    existing.push(entry);
    await writeLog(existing);
    return NextResponse.json({ success: true, eventId: entry.id });
  } catch (err) {
    console.error("[ALE] Failed to record learning event", err);
    return NextResponse.json({ success: false, error: "Failed to record learning event" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const events = await readLog();
    return NextResponse.json({ success: true, events });
  } catch (err) {
    console.error("[ALE] Failed to read learning events", err);
    return NextResponse.json({ success: false, error: "Failed to read learning events" }, { status: 500 });
  }
}
