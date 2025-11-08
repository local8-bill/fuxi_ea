export type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

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
  techFit: 0.20,
  strategicAlignment: 0.20,
  peopleReadiness: 0.10,
};

export function clamp(v: number, min = 1, max = 5) {
  return Math.max(min, Math.min(max, v));
}

export function compositeScore(s: Scores, w: Weights) {
  const n = (x: number) => (clamp(x) - 1) / 4; // 1..5 -> 0..1
  const val =
    n(s.opportunity) * w.opportunity +
    n(s.maturity) * w.maturity +
    n(s.techFit) * w.techFit +
    n(s.strategicAlignment) * w.strategicAlignment +
    n(s.peopleReadiness) * w.peopleReadiness;
  return Math.round(val * 100) / 100; // 0..1
}

export function heatColor(score01: number) {
  if (score01 >= 0.75) return "#DEF7EC";
  if (score01 >= 0.5)  return "#FEF3C7";
  if (score01 >= 0.25) return "#FFEDD5";
  return "#FEE2E2";
}

export function aiCoachTip(s: Scores): string {
  const tips: string[] = [];
  if (s.maturity <= 2 && s.opportunity >= 4) tips.push("Low maturity + high opportunity → consider near-term investment.");
  if (s.techFit <= 2) tips.push("Tech fit is low → review platform alignment and integration constraints.");
  if (s.peopleReadiness <= 2) tips.push("People readiness is low → plan enablement & change mgmt early.");
  if (s.strategicAlignment <= 2) tips.push("Strategic alignment weak → validate outcomes & KPIs.");
  if (!tips.length) return "Looks balanced. Explore adjacent capabilities for compounding value.";
  return tips.join("  •  ");
}

export const DEFAULT_SCORES: Scores = {
  maturity: 3,
  techFit: 3,
  strategicAlignment: 3,
  peopleReadiness: 3,
  opportunity: 3,
}; 