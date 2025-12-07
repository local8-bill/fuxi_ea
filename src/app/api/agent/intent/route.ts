import { NextRequest, NextResponse } from "next/server";
import { appendSessionMessage, loadAgentSession, saveAgentSession } from "@/lib/agent/sessionStore";
import { classifyIntent, extractFocusAreas } from "@/lib/agent/intentClassifier";
import { recordTelemetry } from "@/lib/telemetry/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, message, context } = await req.json();
    if (!projectId || !message) {
      return NextResponse.json({ error: "projectId and message are required" }, { status: 400 });
    }

    const { session } = await loadAgentSession(projectId);
    const normalizedMessage = String(message);

    const focusAreas = extractFocusAreas(normalizedMessage);
    if (focusAreas.length) {
      const existing = new Set(session.memory.focusAreas ?? []);
      focusAreas.forEach((focus) => existing.add(focus));
      session.memory.focusAreas = Array.from(existing).slice(-6);
    }
    if (context?.view) session.memory.lastView = context.view;
    if (context?.mode) session.memory.lastMode = context.mode;

    appendSessionMessage(session, { role: "user", content: normalizedMessage });

    const intent = classifyIntent(normalizedMessage, session);
    session.memory.lastIntent = intent.id;

    appendSessionMessage(session, {
      role: "assistant",
      content: intent.responseHint,
      intent: intent.id,
      action: intent.action?.type,
    });

    await saveAgentSession(session);

    await recordTelemetry({
      event_type: "conversation_intent",
      workspace_id: "uxshell",
      data: {
        projectId,
        intent: intent.id,
        action: intent.action?.type,
        confidence: intent.confidence,
        focus: session.memory.focusAreas,
      },
    });

    return NextResponse.json({ session, intent });
  } catch (err: any) {
    console.error("[/api/agent/intent] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
