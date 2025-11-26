import type { ImpactEffortResult } from "../schema";

export function aiOpportunityIndex(score: ImpactEffortResult): number {
  // Formula from Directive 0003: (Impact * 0.6) + (Effort_Inverse * 0.3) + (Readiness * 0.1)
  const impact = clamp(score.impact);
  const effortInverse = 100 - clamp(score.effort);
  const readiness = clamp(score.readiness ?? 0);
  const value = impact * 0.6 + effortInverse * 0.3 + readiness * 0.1;
  return Math.round(value);
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}
