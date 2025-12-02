import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { recordTelemetry } from "@/lib/telemetry/server";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const TRANSFORMATION_DIR = path.join(DATA_ROOT, "transformation");
const TRANSFORMATION_FILE = path.join(TRANSFORMATION_DIR, "transformation_actions.json");

type ActionPayload = {
  system_id: string;
  label: string;
  domain: string;
  state: string;
  confidence: number;
  sources?: string[];
  action: string;
  mapped_system?: string;
  effort?: string | null;
  timeline_months?: number | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { projectId?: string; actions?: ActionPayload[] } | null;
    if (!body || !Array.isArray(body.actions)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    await fs.mkdir(TRANSFORMATION_DIR, { recursive: true });
    await fs.writeFile(
      TRANSFORMATION_FILE,
      JSON.stringify({ projectId: body.projectId ?? "", actions: body.actions }, null, 2),
      "utf8",
    );

    await recordTelemetry({
      session_id: "server",
      workspace_id: "transformation_dialogue",
      event_type: "transformation_plan_confirm",
      data: { project_id: body.projectId, action_count: body.actions.length },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[TRANSFORMATION] Failed to save actions", err);
    return NextResponse.json({ ok: false, error: "Failed to save actions" }, { status: 500 });
  }
}
