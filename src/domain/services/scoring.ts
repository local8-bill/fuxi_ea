// Domain scoring primitives + blended multi-level composite

export type Scores = {
  opportunity?: number;          // 0..1
  maturity?: number;             // 0..1
  techFit?: number;              // 0..1
  strategicAlignment?: number;   // 0..1
  peopleReadiness?: number;      // 0..1
};

export type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

// Default weights (roughly equal)
export const defaultWeights: Weights = {
  opportunity: 1,
  maturity: 1,
  techFit: 1,
  strategicAlignment: 1,
  peopleReadiness: 1,
};

// Normalize a weights object to sum to 1 (utility)
export function normalizeWeights(w: Weights): Weights {
  const sum =
    (w.opportunity ?? 0) +
    (w.maturity ?? 0) +
    (w.techFit ?? 0) +
    (w.strategicAlignment ?? 0) +
    (w.peopleReadiness ?? 0) || 1;
  return {
    opportunity: (w.opportunity ?? 0) / sum,
    maturity: (w.maturity ?? 0) / sum,
    techFit: (w.techFit ?? 0) / sum,
    strategicAlignment: (w.strategicAlignment ?? 0) / sum,
    peopleReadiness: (w.peopleReadiness ?? 0) / sum,
  };
}

// Weighted composite for a single node's own scores (no children)
export function compositeScore(scores: Scores, weights: Weights): number {
  const w = normalizeWeights(weights);
  const s = {
    opportunity: clamp01(scores.opportunity ?? 0),
    maturity: clamp01(scores.maturity ?? 0),
    techFit: clamp01(scores.techFit ?? 0),
    strategicAlignment: clamp01(scores.strategicAlignment ?? 0),
    peopleReadiness: clamp01(scores.peopleReadiness ?? 0),
  };

  // If all zeros, return 0 (avoid returning NaN)
  const sumW =
    w.opportunity +
    w.maturity +
    w.techFit +
    w.strategicAlignment +
    w.peopleReadiness || 1;

  const num =
    s.opportunity * w.opportunity +
    s.maturity * w.maturity +
    s.techFit * w.techFit +
    s.strategicAlignment * w.strategicAlignment +
    s.peopleReadiness * w.peopleReadiness;

  return clamp01(num / sumW);
}

// —— New: blended multi-level composite ——
// If a node has BOTH its own scores AND children, blend them.
// Default blend = 0.5 (50% self / 50% children).
export function compositeNode(
  cap: { scores?: Scores; children?: any[] },
  weights: Weights,
  opts?: { blend?: number }
): number {
  const blend = clamp01(opts?.blend ?? 0.5);

  const hasSelf = !!cap.scores && Object.keys(cap.scores!).length > 0;
  const kids = Array.isArray(cap.children) ? cap.children : [];
  const hasKids = kids.length > 0;

  const selfScore = hasSelf ? compositeScore(cap.scores!, weights) : null;
  const childScore = hasKids
    ? average(
        kids.map((c) => compositeNode(c, weights, opts))
      )
    : null;

  if (selfScore != null && childScore != null) {
    return clamp01(blend * selfScore + (1 - blend) * childScore);
  }
  if (selfScore != null) return selfScore;
  if (childScore != null) return childScore;
  return 0;
}

// Simple helpers
export function average(nums: number[]): number {
  if (!nums.length) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}