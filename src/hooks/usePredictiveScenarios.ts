import { useMemo } from "react";
import type { PhaseInsight } from "@/components/graph/GraphSimulationControls";

export type PredictiveScenario = {
  id: string;
  title: string;
  summary: string;
  confidence: number; // 0-1
  roiDelta: number; // 0.05 => +5%
  tccDelta: number; // millions
  timelineDeltaMonths: number;
  phase: string;
};

export function usePredictiveScenarios(insights: PhaseInsight[], activePhase: string): PredictiveScenario[] {
  return useMemo(() => {
    if (!insights.length) return [];
    const sorted = [...insights].sort((a, b) => a.roi - b.roi);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    const active = insights.find((insight) => insight.phase === activePhase) ?? insights[0];

    const scenarios: PredictiveScenario[] = [];
    if (weakest) {
      scenarios.push({
        id: `accelerate-${weakest.phase}`,
        title: `Accelerate ${weakest.label}`,
        summary: `Shift resources to ${weakest.label} to close the ROI gap with ${strongest.label}.`,
        confidence: 0.72,
        roiDelta: Math.max(0.02, strongest.roi - weakest.roi) * 0.6,
        tccDelta: -(weakest.tcc * 0.12),
        timelineDeltaMonths: -2,
        phase: weakest.phase,
      });
    }
    scenarios.push({
      id: `stabilize-${active.phase}`,
      title: `Stabilize ${active.label}`,
      summary: `Lock current sequencing but tighten telemetry on ${active.label} to increase confidence.`,
      confidence: 0.64,
      roiDelta: 0.01,
      tccDelta: -(active.tcc * 0.05),
      timelineDeltaMonths: 0,
      phase: active.phase,
    });
    scenarios.push({
      id: "experiment-cross-region",
      title: "Stagger regions",
      summary: "Run EMEA first, NA second to absorb integration risk while keeping ROI trajectory steady.",
      confidence: 0.58,
      roiDelta: 0.03,
      tccDelta: 0.5,
      timelineDeltaMonths: 1,
      phase: strongest.phase,
    });
    return scenarios;
  }, [insights, activePhase]);
}
