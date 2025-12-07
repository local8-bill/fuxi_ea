import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeTelemetryPayload, workspaceEnum } from "@/lib/telemetry/validation";
import { updateDemoTelemetry } from "@/lib/telemetry/demoMetrics";

export const runtime = "nodejs";

type TelemetryPayload = {
  session_id: string;
  project_id?: string;
  workspace_id: string;
  event_type: string;
  timestamp?: string;
  data?: Record<string, unknown>;
  simplification_score?: number;
  anticipation_id?: string;
  context_route?: string;
  time_to_action?: number;
};

const DATA_DIR = path.join(process.cwd(), ".fuxi", "data");
const EVENTS_FILE = path.join(DATA_DIR, "telemetry_events.ndjson");

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // per IP per minute
const rateBuckets = new Map<string, { count: number; ts: number }>();

function isAuthorized(req: Request) {
  const optional = process.env.FUXI_AUTH_OPTIONAL === "true";
  const token = process.env.MESH_AUTH_TOKEN || process.env.TELEMETRY_TOKEN;
  if (!token) return optional;
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    const provided = header.replace("Bearer ", "").trim();
    return provided === token;
  }
  return optional;
}

function rateLimit(ip: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.ts > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, ts: now });
    return false;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return true;
  bucket.count += 1;
  return false;
}

function getIP(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (req as any)?.ip ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const ip = getIP(req);
    if (rateLimit(ip)) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const size = Number(req.headers.get("content-length") || "0");
    if (size > 50_000) {
      return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }

    const json = (await req.json().catch(() => null)) as TelemetryPayload | null;
    if (!json || typeof json !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = normalizeTelemetryPayload({
      session_id: json.session_id,
      project_id: json.project_id,
      workspace_id: (json.workspace_id as any) ?? "digital_enterprise",
      event_type: json.event_type,
      timestamp: json.timestamp,
      data: json.data,
      simplification_score: json.simplification_score,
      anticipation_id: json.anticipation_id,
      context_route: json.context_route,
      time_to_action: json.time_to_action,
    });
    if (!workspaceEnum.options.includes(parsed.workspace_id as any)) {
      parsed.workspace_id = "digital_enterprise";
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    const line = JSON.stringify(parsed) + "\n";
    await fs.appendFile(EVENTS_FILE, line, "utf8");
    await updateDemoTelemetry(parsed);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[TELEMETRY] Failed to record event", err);
    const message = err?.message || "Invalid telemetry payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8").catch(() => "");
    const events = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-50)
      .map((line) => JSON.parse(line));
    return NextResponse.json({ ok: true, events });
  } catch (err: any) {
    console.error("[TELEMETRY] Failed to read events", err);
    return NextResponse.json({ ok: false, error: "Failed to read events" }, { status: 500 });
  }
}
