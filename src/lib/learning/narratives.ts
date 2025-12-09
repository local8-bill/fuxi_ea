import type { LearningMetrics, GraphContext, LearningEvent } from "./types";
import { getLearningState } from "./persistence";

export function composeNarrative({
  metrics,
  context,
  event,
}: {
  metrics: LearningMetrics;
  context: GraphContext;
  event: LearningEvent;
}): string {
  const impact = `${context.systems || 0} systems, ${context.integrations || 0} integrations`;
  if (metrics.risk > 0.75) {
    return `High-risk change detected (${impact}). Confidence dipped to ${(metrics.confidence * 100).toFixed(0)}%.`;
  }
  if (metrics.velocity < 0.4) {
    return `Sequencer velocity is low (${(metrics.velocity * 100).toFixed(0)}%). Consider rebalancing waves.`;
  }
  if (metrics.maturity > 0.7) {
    return `Adaptive maturity is strong at ${(metrics.maturity * 100).toFixed(0)}%. Keep your current cadence.`;
  }
  const intentSnippet = event.intent ? `Intent “${event.intent}”` : "Intent";
  return `${intentSnippet} touches ${impact}. Confidence steady at ${(metrics.confidence * 100).toFixed(0)}%.`;
}

export async function getLatestNarrative(projectId: string): Promise<string | null> {
  const state = await getLearningState(projectId);
  return state?.narrative ?? null;
}
