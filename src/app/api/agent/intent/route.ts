import { NextRequest, NextResponse } from "next/server";
import { appendSessionMessage, loadAgentSession, saveAgentSession } from "@/lib/agent/sessionStore";
import { classifyIntent, extractFocusAreas } from "@/lib/agent/intentClassifier";
import { recordTelemetry } from "@/lib/telemetry/server";
import { buildAcknowledgement, composeUtterance, promptForIntent } from "@/lib/agent/tone";
import { analyzeUserTone, blendProfiles, defaultToneProfile } from "@/lib/agent/toneProfile";
import { appendFeedback } from "@/lib/feedback/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, message, context } = await req.json();
    if (!projectId || !message) {
      return NextResponse.json({ error: "projectId and message are required" }, { status: 400 });
    }

    const { session } = await loadAgentSession(projectId);
    const normalizedMessage = String(message);
    const trimmedMessage = normalizedMessage.trim();
    const lowerMessage = trimmedMessage.toLowerCase();
    const awaitingFeedback = Boolean(session.memory.feedbackAwaiting);
    const userId = session.memory.designLocks?.[0]?.id ?? session.projectId ?? "anon_local";

    const previousFocus = Array.isArray(session.memory.focusAreas) ? [...session.memory.focusAreas] : [];
    const focusAreas = extractFocusAreas(normalizedMessage);
    let focusChanged = false;
    if (focusAreas.length) {
      const existing = new Set(previousFocus);
      focusAreas.forEach((focus) => existing.add(focus));
      const merged = Array.from(existing).slice(-6);
      focusChanged = merged.join("|") !== previousFocus.join("|");
      session.memory.focusAreas = merged;
    }
    if (context?.view) session.memory.lastView = context.view;
    if (context?.mode) session.memory.lastMode = context.mode;

    appendSessionMessage(session, { role: "user", content: normalizedMessage });

    const sceneContext = typeof context?.view === "string" ? context.view : session.memory.lastView;
    if (lowerMessage.startsWith("/feedback") || awaitingFeedback) {
      const payload = lowerMessage.startsWith("/feedback") ? trimmedMessage.replace(/^\/feedback\s*/i, "").trim() : trimmedMessage;
      if (lowerMessage.startsWith("/feedback")) {
        await recordTelemetry({
          event_type: "feedback_initiated",
          workspace_id: "uxshell",
          data: { projectId, scene: sceneContext },
        });
      }
      session.memory.lastIntent = "feedback";
      if (!awaitingFeedback && !payload.length) {
        session.memory.feedbackAwaiting = true;
        appendSessionMessage(session, {
          role: "assistant",
          content: "Got it — I'd love to hear your thoughts. What's on your mind?",
          intent: "feedback_initiated",
        });
        await saveAgentSession(session);
        return NextResponse.json({
          session,
          intent: {
            id: "feedback_initiated",
            label: "Feedback Initiated",
            confidence: 1,
            responseHint: "Awaiting feedback details.",
          },
        });
      }

      const feedbackMessage = payload.length ? payload : trimmedMessage;
      session.memory.feedbackAwaiting = false;
      await appendFeedback({
        user_id: userId,
        project_id: projectId,
        scene: sceneContext,
        message: feedbackMessage,
      });
      appendSessionMessage(session, {
        role: "assistant",
        content: "Thank you — I've logged that feedback for the team. Anything else you'd like to explore?",
        intent: "feedback_submitted",
      });
      await saveAgentSession(session);
      await recordTelemetry({
        event_type: "feedback_submitted",
        workspace_id: "uxshell",
        data: { projectId, scene: sceneContext },
      });
      return NextResponse.json({
        session,
        intent: {
          id: "feedback_submitted",
          label: "Feedback Submitted",
          confidence: 0.99,
          responseHint: "Feedback captured.",
        },
      });
    }

    const priorIntent = session.memory.lastIntent;
    const intent = classifyIntent(normalizedMessage, session);
    session.memory.lastIntent = intent.id;
    const previousProfile = session.memory.toneProfile ?? defaultToneProfile();
    const freshProfile = analyzeUserTone(normalizedMessage);
    const blendedProfile = blendProfiles(previousProfile, freshProfile);
    const tone = blendedProfile.formality;
    const toneChanged = previousProfile.formality !== blendedProfile.formality;
    session.memory.toneProfile = blendedProfile;
    const acknowledgement = buildAcknowledgement(tone, normalizedMessage);
    const reflect = context?.view ? `Context: ${context.view} view.` : undefined;
    const prompt = promptForIntent(intent.id);
    const assistantContent = composeUtterance(tone, {
      acknowledge: acknowledgement,
      reflect,
      respond: intent.responseHint,
      prompt,
    });

    appendSessionMessage(session, {
      role: "assistant",
      content: assistantContent,
      intent: intent.id,
      action: intent.action?.type,
    });

    await saveAgentSession(session);

    if (toneChanged) {
      await recordTelemetry({
        event_type: "tone_profile_change",
        workspace_id: "uxshell",
        data: {
          projectId,
          old: previousProfile.formality,
          new: blendedProfile.formality,
          verbosity: blendedProfile.verbosity,
        },
      });
    }

    if (focusChanged) {
      await recordTelemetry({
        event_type: "conversation_context_updated",
        workspace_id: "uxshell",
        data: {
          projectId,
          focusPlatforms: session.memory.focusAreas,
        },
      });
    }

    await recordTelemetry({
      event_type: "conversation_intent",
      workspace_id: "uxshell",
      data: {
        projectId,
        intent: intent.id,
        action: intent.action?.type,
        confidence: intent.confidence,
        focus: session.memory.focusAreas,
        tone,
      },
    });

    return NextResponse.json({ session, intent });
  } catch (err: any) {
    console.error("[/api/agent/intent] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
