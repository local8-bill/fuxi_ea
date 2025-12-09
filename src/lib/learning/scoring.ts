import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
import type { GraphContext, LearningMetrics } from "./types";
import { getClassificationDefinitions, getClassificationMix } from "@/lib/inventory/classification";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export async function loadGraphContext(projectId: string): Promise<GraphContext> {
  const stats = await getStatsForProject(projectId).catch(() => null);
  const systems = stats?.systemsFuture ?? stats?.topSystems?.length ?? 0;
  const integrations = stats?.integrationsFuture ?? 0;
  let domains = stats?.domainsDetected ?? 0;
  if (!domains) {
    domains = systems ? Math.max(1, Math.round(systems / 5)) : 1;
  }
  const classificationMix = await getClassificationMix(projectId);
  const definitions = await getClassificationDefinitions();
  const riskModifier = computeRiskModifier(classificationMix, definitions);
  const derivedWaveTarget = computeWaveTarget(classificationMix, definitions);
  return {
    systems,
    integrations,
    domains,
    classificationMix,
    riskModifier,
    derivedWaveTarget,
  };
}

export function scoreLearning(
  context: GraphContext,
  progress: { completedWaves: number; totalWaves: number },
  eventType: string,
): LearningMetrics {
  const baseRisk = clamp(((context.integrations || 0) / 250) * 0.9);
  const riskModifier = context.riskModifier ?? 1;
  const risk = clamp(baseRisk * riskModifier);
  let confidence = clamp(1 - risk);
  if (eventType === "sequencer_timeline_shifted") {
    confidence = clamp(confidence - 0.05);
  }
  const derivedWaveTarget = context.derivedWaveTarget ?? 3;
  const totalWaves = progress.totalWaves > 0 ? progress.totalWaves : derivedWaveTarget;
  const completed = clamp(progress.completedWaves / totalWaves, 0, 1);
  const velocity = clamp(completed * 0.8);
  const maturity = clamp((confidence + velocity) / 2);
  return { risk, confidence, velocity, maturity };
}

function computeRiskModifier(mix: Record<string, number>, defs: Map<string, { risk_weight: number }>) {
  const modifier = Object.entries(mix).reduce((sum, [name, weight]) => {
    const def = defs.get(name);
    const riskWeight = def?.risk_weight ?? 1;
    return sum + weight * riskWeight;
  }, 0);
  return modifier || 1;
}

function computeWaveTarget(mix: Record<string, number>, defs: Map<string, { sequencer_wave: number }>) {
  const weighted = Object.entries(mix).reduce((sum, [name, weight]) => {
    const def = defs.get(name);
    const wave = def?.sequencer_wave ?? 2;
    return sum + weight * wave;
  }, 0);
  if (!weighted) return 3;
  return Math.max(1, Math.round(weighted));
}
