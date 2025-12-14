import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type IntegrationFlow = {
  flow_id: string;
  source: string;
  system_from: string;
  system_to: string;
  env?: string;
  status?: string;
  last_seen?: string;
  latency_ms?: number;
  error_rate?: number;
  owner_team?: string;
  confidence?: number;
};

const ALE_DIR = path.join(process.cwd(), "src", "data", "ale");
const STORE_FILE = path.join(ALE_DIR, "integration_flows.json");

async function readStore(): Promise<IntegrationFlow[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(flows: IntegrationFlow[]) {
  await fs.mkdir(ALE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(flows, null, 2));
}

function sanitizeFlow(value: any): IntegrationFlow | null {
  if (!value || typeof value !== "object") return null;
  const { flow_id, source, system_from, system_to } = value;
  if (!flow_id || !source || !system_from || !system_to) return null;
  const now = new Date().toISOString();
  return {
    flow_id: String(flow_id),
    source: String(source),
    system_from: String(system_from),
    system_to: String(system_to),
    env: value.env ? String(value.env) : undefined,
    status: value.status ? String(value.status) : undefined,
    last_seen: value.last_seen ? String(value.last_seen) : now,
    latency_ms: typeof value.latency_ms === "number" ? value.latency_ms : Number(value.latency_ms ?? 0),
    error_rate: typeof value.error_rate === "number" ? value.error_rate : Number(value.error_rate ?? 0),
    owner_team: value.owner_team ? String(value.owner_team) : undefined,
    confidence: typeof value.confidence === "number" ? value.confidence : Number(value.confidence ?? 0.8),
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sourceFilter = url.searchParams.get("source");
    const flows = await readStore();
    const filtered = sourceFilter ? flows.filter((flow) => flow.source === sourceFilter) : flows;
    return NextResponse.json({ success: true, flows: filtered });
  } catch (err) {
    console.error("[ALE] integration-flows GET failed", err);
    return NextResponse.json({ success: false, error: "Unable to read integration flows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const inputArray = Array.isArray(payload) ? payload : payload ? [payload] : [];
    const normalized = inputArray
      .map((item) => sanitizeFlow(item))
      .filter((item): item is IntegrationFlow => Boolean(item));

    if (!normalized.length) {
      return NextResponse.json({ success: false, error: "No valid integration flows supplied" }, { status: 400 });
    }

    const existing = await readStore();
    const map = new Map(existing.map((flow) => [flow.flow_id, flow]));
    normalized.forEach((flow) => map.set(flow.flow_id, flow));
    const merged = Array.from(map.values());
    await writeStore(merged);

    return NextResponse.json({ success: true, count: normalized.length, total: merged.length });
  } catch (err) {
    console.error("[ALE] integration-flows POST failed", err);
    return NextResponse.json({ success: false, error: "Failed to store integration flows" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sourceFilter = url.searchParams.get("source");
    const existing = await readStore();
    const filtered = sourceFilter ? existing.filter((flow) => flow.source !== sourceFilter) : [];
    await writeStore(filtered);
    const removed = existing.length - filtered.length;
    return NextResponse.json({ success: true, removed, remaining: filtered.length });
  } catch (err) {
    console.error("[ALE] integration-flows DELETE failed", err);
    return NextResponse.json({ success: false, error: "Failed to delete integration flows" }, { status: 500 });
  }
}
