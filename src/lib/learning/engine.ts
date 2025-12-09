import { emitTelemetry } from "@/lib/telemetry";
import { updateProgressState, saveLearningState, appendLearningRecord, logAdaptiveEvent } from "./persistence";
import { loadGraphContext, scoreLearning } from "./scoring";
import { composeNarrative } from "./narratives";
import type { LearningEvent } from "./types";

export async function processLearningEvent(event: LearningEvent) {
  const projectId = event.projectId || "demo";
  const progress = await updateProgressState(projectId, {
    wave: event.wave,
    totalWaves: event.totalWaves,
    type: event.type,
  });
  const context = await loadGraphContext(projectId);
  const metrics = scoreLearning(context, progress, event.type);
  const narrative = composeNarrative({ metrics, context, event });
  const timestamp = new Date().toISOString();
  await appendLearningRecord({
    project_id: projectId,
    intent: event.intent,
    event_type: event.type,
    wave: event.wave,
    systems: context.systems,
    integrations: context.integrations,
    domains: context.domains,
    classification_mix: context.classificationMix,
    ...metrics,
    timestamp,
  });
  await saveLearningState(projectId, {
    completedWaves: progress.completedWaves,
    totalWaves: progress.totalWaves,
    metrics,
    narrative,
    updatedAt: timestamp,
  });
  const adaptivePayload = { projectId, metrics, classificationMix: context.classificationMix };
  await logAdaptiveEvent(`ale-lite:${event.type}`, adaptivePayload);
  emitTelemetry("ale_lite.metrics_updated", adaptivePayload);
  return { metrics, narrative };
}
