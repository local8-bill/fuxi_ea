import { NextRequest, NextResponse } from "next/server";
import { loadAgentSession, saveAgentSession } from "@/lib/agent/sessionStore";
import { loadRecentTelemetry } from "@/lib/agent/context";
import { recordTelemetry } from "@/lib/telemetry/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") ?? "demo";
    const mode = url.searchParams.get("mode") ?? "Architect";
    const view = url.searchParams.get("view") ?? "graph";
    const resume = url.searchParams.get("resume") === "1";

    const { session, existing } = await loadAgentSession(projectId);
    let touched = false;
    if (session.memory.lastMode !== mode) {
      session.memory.lastMode = mode;
      touched = true;
    }
    if (session.memory.lastView !== view) {
      session.memory.lastView = view;
      touched = true;
    }
    if (touched) {
      session.updatedAt = new Date().toISOString();
      await saveAgentSession(session);
    }

    if (resume && existing && session.messages.length) {
      await recordTelemetry({
        event_type: "context_resume_detected",
        workspace_id: "uxshell",
        data: { projectId, conversationLength: session.messages.length },
      });
    }

    const recentTelemetry = await loadRecentTelemetry(6);

    return NextResponse.json({
      projectId,
      mode,
      view,
      recentTelemetry,
      session,
    });
  } catch (err: any) {
    console.error("[/api/agent/context] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
