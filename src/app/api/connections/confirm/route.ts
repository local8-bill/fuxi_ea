import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { recordTelemetry } from "@/lib/telemetry/server";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const CONNECTION_DIR = path.join(DATA_ROOT, "connections");
const CONNECTION_FILE = path.join(CONNECTION_DIR, "confirmed_connections.json");
const TRANSFORMED_EDGE_FILE = path.join(CONNECTION_DIR, "derived_edges.json");

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      projectId?: string;
      decisions?: Array<{
        id: string;
        decision: "confirmed" | "rejected";
        reason?: string;
        source: string;
        target: string;
        confidence: number;
        rationale?: string;
      }>;
    } | null;

    if (!body || !Array.isArray(body.decisions)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    await fs.mkdir(CONNECTION_DIR, { recursive: true });
    await fs.writeFile(
      CONNECTION_FILE,
      JSON.stringify({ projectId: body.projectId ?? "", decisions: body.decisions }, null, 2),
      "utf8",
    );

    // Derive confirmed edges for DE integration
    const confirmed = body.decisions.filter((d) => d.decision === "confirmed");
    await fs.writeFile(
      TRANSFORMED_EDGE_FILE,
      JSON.stringify(
        {
          projectId: body.projectId ?? "",
          edges: confirmed.map((c) => ({
            id: `${c.source}->${c.target}`,
            source: c.source,
            target: c.target,
            confidence: c.confidence ?? 0,
            state: "confirmed",
            reason: c.reason ?? "",
          })),
        },
        null,
        2,
      ),
      "utf8",
    );

    await recordTelemetry({
      session_id: "server",
      workspace_id: "connection_confirmation",
      event_type: "connection_decisions_saved",
      data: { project_id: body.projectId, decisions: body.decisions.length },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[CONNECTIONS] Failed to persist decisions", err);
    return NextResponse.json({ ok: false, error: "Failed to persist decisions" }, { status: 500 });
  }
}
