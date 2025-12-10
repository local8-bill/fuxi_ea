import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "src", "data", "ale");
const LOG_FILE = path.join(DATA_DIR, "reasoning_log.json");

type ReasoningPayload = {
  node_id?: string;
  context_tags?: string[];
  user_action?: string;
  user_mode?: string;
  timestamp?: string;
  risk_score?: number;
};

function validatePayload(payload: ReasoningPayload) {
  if (!payload || typeof payload.node_id !== "string" || !payload.node_id.trim()) return false;
  if (typeof payload.user_action !== "string" || !payload.user_action.trim()) return false;
  if (payload.context_tags && !Array.isArray(payload.context_tags)) return false;
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
    const payload = (await req.json().catch(() => null)) as ReasoningPayload | null;
    if (!payload || !validatePayload(payload)) {
      return NextResponse.json({ success: false, error: "Invalid reasoning payload" }, { status: 400 });
    }

    const entry = {
      id: uuidv4(),
      node_id: payload.node_id.trim(),
      context_tags: Array.isArray(payload.context_tags) ? payload.context_tags.filter((tag) => typeof tag === "string" && tag.length > 0) : [],
      user_action: payload.user_action.trim(),
      user_mode: typeof payload.user_mode === "string" ? payload.user_mode : "unknown",
      risk_score: typeof payload.risk_score === "number" ? payload.risk_score : null,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    const existing = await readLog();
    existing.push(entry);
    await writeLog(existing);

    return NextResponse.json({ success: true, logId: entry.id });
  } catch (err) {
    console.error("[ALE] Failed to record reasoning event", err);
    return NextResponse.json({ success: false, error: "Failed to record reasoning event" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const events = await readLog();
    return NextResponse.json({ success: true, events });
  } catch (err) {
    console.error("[ALE] Failed to read reasoning events", err);
    return NextResponse.json({ success: false, error: "Failed to read reasoning events" }, { status: 500 });
  }
}
