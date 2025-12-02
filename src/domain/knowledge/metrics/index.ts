import type { ImpactEffortResult } from "../schema";

export function aiOpportunityIndex(score: ImpactEffortResult): number {
  // Formula from Directive 0003: (Impact * 0.6) + (Effort_Inverse * 0.3) + (Readiness * 0.1)
  const impact = clamp(score.impact);
  const effortInverse = 100 - clamp(score.effort);
  const readiness = clamp(score.readiness ?? 0);
  const value = impact * 0.6 + effortInverse * 0.3 + readiness * 0.1;
  return Math.round(value);
}

/** Simple readiness calculator; averages normalized inputs. */
export function aiReadinessScore(inputs: { data: number; governance: number; architecture: number; talent: number }): number {
  const vals = [inputs.data, inputs.governance, inputs.architecture, inputs.talent].map(clamp);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg);
}

/** Redundancy index: proportion of overlapping systems within a domain (0-100, higher = more redundancy). */
export function redundancyIndex(overlapCount: number, totalSystems: number): number {
  if (totalSystems <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, overlapCount / totalSystems));
  return Math.round(ratio * 100);
}

/** ROI uplift: (benefit - cost) / max(cost, epsilon) mapped to 0-100. Negative values clamp to 0. */
export function roiScore(benefit: number, cost: number): number {
  const denom = Math.max(cost, 0.01);
  const raw = (benefit - cost) / denom;
  if (!Number.isFinite(raw)) return 0;
  const pct = raw * 100;
  return Math.round(Math.max(0, Math.min(150, pct))); // cap to 150 for display
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}
