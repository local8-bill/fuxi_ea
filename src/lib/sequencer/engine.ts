"use server";

import { emitTelemetry, logAdaptiveChange } from "@/lib/telemetry";
import { recordIntentFeedback, type IntentFeedbackEvent } from "@/lib/change-intelligence/intent-model";
import { generateDemoMetrics } from "@/lib/change-intelligence/demoLearning";

export async function runSequencerEvent(type: string, payload: IntentFeedbackEvent) {
  emitTelemetry(type, payload);
  await recordIntentFeedback({ type, ...payload });
  const projectId = String((payload?.project_id as string | undefined) ?? "demo-project");
  const metrics = await generateDemoMetrics(projectId);
  logAdaptiveChange(`demo learning metrics refreshed for ${projectId}`, metrics);
}
