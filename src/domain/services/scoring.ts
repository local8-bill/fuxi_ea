export type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export const defaultWeights: Weights = {
  opportunity: 0.30,
  maturity: 0.20,
  techFit: 0.15,
  strategicAlignment: 0.25,
  peopleReadiness: 0.10,
};

export type Scores = Partial<{
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
}>;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function compositeScore(scores: Scores, w: Weights): number {
  const parts: Array<[number, number]> = [
    [scores.opportunity ?? 0, w.opportunity],
    [scores.maturity ?? 0, w.maturity],
    [scores.techFit ?? 0, w.techFit],
    [scores.strategicAlignment ?? 0, w.strategicAlignment],
    [scores.peopleReadiness ?? 0, w.peopleReadiness],
  ];
  let num = 0, den = 0;
  for (const [s, weight] of parts) {
    if (Number.isFinite(s)) {
      num += clamp01(s) * weight;
      den += weight;
    }
  }
  return den > 0 ? num / den : 0;
}
