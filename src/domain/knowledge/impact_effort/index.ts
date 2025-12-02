import type { ImpactEffortResult } from "../schema";

export function classifyQuadrant(impact: number, effort: number): ImpactEffortResult["quadrant"] {
  const highImpact = impact >= 60;
  const lowEffort = effort < 50;

  if (highImpact && lowEffort) return "quick_win";
  if (highImpact && !lowEffort) return "strategic_investment";
  if (!highImpact && lowEffort) return "self_service";
  return "deprioritize";
}

export function toImpactEffortResult(impact: number, effort: number, readiness = 0): ImpactEffortResult {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const i = clamp(impact);
  const e = clamp(effort);
  const r = clamp(readiness);

  return {
    impact: i,
    effort: e,
    readiness: r,
    quadrant: classifyQuadrant(i, e),
  };
}
