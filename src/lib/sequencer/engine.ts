"use server";

import { emitTelemetry, logAdaptiveChange } from "@/lib/telemetry";
import { recordIntentFeedback, type IntentFeedbackEvent } from "@/lib/change-intelligence/intent-model";
import { processLearningEvent } from "@/lib/learning/engine";

export async function runSequencerEvent(type: string, payload: IntentFeedbackEvent) {
  emitTelemetry(type, payload);
  await recordIntentFeedback({ type, ...payload });
  const projectId = String((payload?.project_id as string | undefined) ?? "demo-project");
  const learning = await processLearningEvent({
    projectId,
    type,
    wave: typeof payload?.wave === "number" ? payload.wave : undefined,
    totalWaves: typeof (payload as any)?.total_waves === "number" ? (payload as any).total_waves : undefined,
    intent: typeof (payload as any)?.intent === "string" ? (payload as any).intent : undefined,
  });
  logAdaptiveChange(`[ALE-Lite] ${type}`, learning.metrics);
}
