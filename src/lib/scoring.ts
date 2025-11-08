// src/lib/scoring.ts
// --- Types ---
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

// --- Defaults ---
export const DEFAULT_SCORES: Scores = {
  opportunity: 3,
  maturity: 3,
  techFit: 3,
  strategicAlignment: 3,
  peopleReadiness: 3,
};

export const defaultWeights: Weights = {
  opportunity: 0.30,
  maturity: 0.20,
  techFit: 0.20,
  strategicAlignment: 0.20,
  peopleReadiness: 0.10,
};

// --- Utility helpers ---
export const average = (vals: number[]) =>
  vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

// normalize (1–5) → (0–1)
const clamp = (v: number, min = 1, max = 5) => Math.max(min, Math.min(max, v));
const norm = (x: number) => (clamp(x) - 1) / 4;

// --- Composite scoring ---
export function compositeScore(s: Scores, w: Weights = defaultWeights): number {
  const score =
    norm(s.opportunity) * w.opportunity +
    norm(s.maturity) * w.maturity +
    norm(s.techFit) * w.techFit +
    norm(s.strategicAlignment) * w.strategicAlignment +
    norm(s.peopleReadiness) * w.peopleReadiness;

  return Math.round(score * 100); // 0..100
}

// --- Color band mapping for heatmap ---
export function colorBand(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-300";
  if (score >= 50) return "bg-yellow-50 border-yellow-300";
  if (score >= 25) return "bg-orange-50 border-orange-300";
  return "bg-red-50 border-red-300";
}