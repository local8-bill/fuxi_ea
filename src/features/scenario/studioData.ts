"use client";

export type ScenarioSeriesPoint = {
  label: string; // e.g., "Q1", "Q2"
  expected: number; // expected portfolio value (normalized 0-1)
  best: number; // best-case
  worst: number; // worst-case
  cost: number; // relative cost (0-1 scaled)
  risk: number; // risk factor 0-1
  volatility: number; // volatility index 0-1
  techFit: number; // normalized tech fit 0-1
  dependencies: number; // dependency density 0-1
};

export type Scenario = {
  id: string;
  name: string;
  type: "Baseline" | "Transformation" | "Budget Optimization" | "Workforce Mix" | "Time Compression";
  summary: string;
  horizon: "quarters" | "years";
  series: ScenarioSeriesPoint[];
  tags?: string[];
};

const baseline: Scenario = {
  id: "baseline",
  name: "Baseline (Current Run-Rate)",
  type: "Baseline",
  summary: "Current-state portfolio with existing costs, risks, and maturity.",
  horizon: "quarters",
  tags: ["run-rate", "reference"],
  series: [
    { label: "Q1", expected: 0.52, best: 0.6, worst: 0.44, cost: 0.62, risk: 0.58, volatility: 0.22, techFit: 0.55, dependencies: 0.36 },
    { label: "Q2", expected: 0.54, best: 0.63, worst: 0.46, cost: 0.63, risk: 0.56, volatility: 0.2, techFit: 0.56, dependencies: 0.35 },
    { label: "Q3", expected: 0.56, best: 0.65, worst: 0.48, cost: 0.64, risk: 0.55, volatility: 0.19, techFit: 0.57, dependencies: 0.34 },
    { label: "Q4", expected: 0.57, best: 0.67, worst: 0.5, cost: 0.65, risk: 0.54, volatility: 0.18, techFit: 0.58, dependencies: 0.33 },
  ],
};

const modernization: Scenario = {
  id: "modernization",
  name: "Modernization Push",
  type: "Transformation",
  summary: "Retire legacy platforms, reinvest in cloud-native capabilities, and trim OpEx by 12%.",
  horizon: "quarters",
  tags: ["cloud", "decommission", "opex -12%"],
  series: [
    { label: "Q1", expected: 0.55, best: 0.68, worst: 0.45, cost: 0.66, risk: 0.57, volatility: 0.21, techFit: 0.62, dependencies: 0.33 },
    { label: "Q2", expected: 0.6, best: 0.74, worst: 0.5, cost: 0.63, risk: 0.52, volatility: 0.19, techFit: 0.66, dependencies: 0.3 },
    { label: "Q3", expected: 0.66, best: 0.8, worst: 0.55, cost: 0.6, risk: 0.48, volatility: 0.17, techFit: 0.7, dependencies: 0.27 },
    { label: "Q4", expected: 0.72, best: 0.86, worst: 0.6, cost: 0.58, risk: 0.45, volatility: 0.16, techFit: 0.74, dependencies: 0.25 },
  ],
};

const budgetShift: Scenario = {
  id: "budget-optimization",
  name: "Budget Optimization",
  type: "Budget Optimization",
  summary: "Shift spend toward underperforming domains and pause low-yield initiatives.",
  horizon: "quarters",
  tags: ["reallocate", "optimization"],
  series: [
    { label: "Q1", expected: 0.53, best: 0.64, worst: 0.45, cost: 0.6, risk: 0.55, volatility: 0.21, techFit: 0.59, dependencies: 0.34 },
    { label: "Q2", expected: 0.58, best: 0.69, worst: 0.48, cost: 0.59, risk: 0.52, volatility: 0.19, techFit: 0.61, dependencies: 0.32 },
    { label: "Q3", expected: 0.61, best: 0.72, worst: 0.5, cost: 0.58, risk: 0.5, volatility: 0.18, techFit: 0.62, dependencies: 0.3 },
    { label: "Q4", expected: 0.64, best: 0.75, worst: 0.52, cost: 0.57, risk: 0.48, volatility: 0.18, techFit: 0.64, dependencies: 0.29 },
  ],
};

const accelerated: Scenario = {
  id: "time-compression",
  name: "Time Compression",
  type: "Time Compression",
  summary: "Pull forward modernization milestones; higher spend, faster value capture.",
  horizon: "quarters",
  tags: ["acceleration", "higher capex"],
  series: [
    { label: "Q1", expected: 0.56, best: 0.7, worst: 0.45, cost: 0.7, risk: 0.6, volatility: 0.23, techFit: 0.62, dependencies: 0.32 },
    { label: "Q2", expected: 0.63, best: 0.78, worst: 0.5, cost: 0.68, risk: 0.56, volatility: 0.21, techFit: 0.66, dependencies: 0.3 },
    { label: "Q3", expected: 0.7, best: 0.85, worst: 0.55, cost: 0.65, risk: 0.52, volatility: 0.19, techFit: 0.7, dependencies: 0.27 },
    { label: "Q4", expected: 0.76, best: 0.9, worst: 0.6, cost: 0.63, risk: 0.48, volatility: 0.18, techFit: 0.73, dependencies: 0.25 },
  ],
};

export const scenarios: Scenario[] = [modernization, budgetShift, accelerated];
export const baselineScenario = baseline;

export type ScenarioStats = {
  roi: number;
  riskExposure: number;
  volatility: number;
  avgCost: number;
  avgValue: number;
};

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length);
}

export function computeStats(s: Scenario): ScenarioStats {
  const value = avg(s.series.map((p) => p.expected));
  const cost = avg(s.series.map((p) => p.cost));
  const risk = avg(s.series.map((p) => (1 - p.techFit) * (p.dependencies + p.risk)));
  const volatility = avg(s.series.map((p) => p.volatility));
  const roi = (value - cost) / Math.max(0.01, cost);
  return { roi, riskExposure: risk, volatility, avgCost: cost, avgValue: value };
}

export function computeDelta(target: Scenario, base: Scenario) {
  const t = computeStats(target);
  const b = computeStats(base);
  return {
    roiDelta: t.roi - b.roi,
    riskDelta: t.riskExposure - b.riskExposure,
    volatilityDelta: t.volatility - b.volatility,
    costDelta: t.avgCost - b.avgCost,
    valueDelta: t.avgValue - b.avgValue,
    targetStats: t,
    baseStats: b,
  };
}

export function mergeSeries(primary: Scenario, baselineFallback: Scenario) {
  // Merge on label so we can overlay baseline expected vs scenario expected
  return primary.series.map((p, idx) => {
    const fallback = baselineFallback.series.find((b) => b.label === p.label) ?? baselineFallback.series[idx] ?? baselineFallback.series[baselineFallback.series.length - 1];
    return {
      label: p.label,
      expected: p.expected,
      best: p.best,
      worst: p.worst,
      cost: p.cost,
      risk: p.risk,
      volatility: p.volatility,
      baselineExpected: fallback?.expected ?? 0,
      baselineCost: fallback?.cost ?? 0,
    };
  });
}

export const scenarioSuggestions: Record<string, string[]> = {
  modernization: [
    "Retire legacy Order Mgmt and re-platform on cloud to reduce risk exposure.",
    "Reinvest 8% OpEx savings into underperforming Data & Analytics capabilities.",
    "Sequence decommissions by dependency density to avoid downstream disruption.",
  ],
  "budget-optimization": [
    "Hold low-yield initiatives; redirect to Digital Commerce and Supply Chain gaps.",
    "Bundle quick wins into Q2 to reduce volatility before larger bets in Q3.",
    "Cap consultant mix at 35% to keep risk exposure stable.",
  ],
  "time-compression": [
    "Front-load migration factory to pull forward ROI; track burn vs value monthly.",
    "Use risk gates on highest-dependency systems to avoid sharp volatility spikes.",
    "Stage releases by domain to keep TechFit above 0.7 by Q4.",
  ],
};
