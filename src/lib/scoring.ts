export type Level = "L1" | "L2" | "L3";
export type Scores = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};
export type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export const DEFAULT_SCORES: Scores = {
  opportunity: 0.5,
  maturity: 0.5,
  techFit: 0.5,
  strategicAlignment: 0.5,
  peopleReadiness: 0.5,
};

export const defaultWeights: Weights = {
  opportunity: 0.25,
  maturity: 0.2,
  techFit: 0.2,
  strategicAlignment: 0.2,
  peopleReadiness: 0.15,
};

export function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// compositeScore returns 0..100
export function compositeScore(s: Scores, w: Weights = defaultWeights): number {
  const raw =
    s.opportunity * w.opportunity +
    s.maturity * w.maturity +
    s.techFit * w.techFit +
    s.strategicAlignment * w.strategicAlignment +
    s.peopleReadiness * w.peopleReadiness;
  return Math.round(raw * 100);
}