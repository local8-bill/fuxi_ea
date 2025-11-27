"use client";

import type { CognitiveMetrics, SimplificationScores, SimplificationSnapshot } from "@/domain/models/uxMetrics";

function clamp(v: number, min = 0, max = 5) {
  return Math.max(min, Math.min(max, v));
}

export function computePSI(metrics: CognitiveMetrics): number {
  const { CL, TF, ID, DC } = metrics;
  if (!DC || DC <= 0) return 0;
  const psi = (CL + TF + ID) / DC;
  return clamp(psi, 0, 5);
}

export function computeCSS(psi: number, frictionIndex: number): number {
  // CSS = avg(PSI_component) × 0.7 + FrictionIndex × 0.3
  const css = psi * 0.7 + frictionIndex * 0.3;
  return clamp(css, 0, 5);
}

export function computeSSS(css: number, contextFactor = 1): number {
  // SSS = weightedAvg(CSS_page) × ContextFactor
  const sss = css * contextFactor;
  return clamp(sss, 0, 5);
}

export function buildSnapshot(
  workspace: string,
  metrics: CognitiveMetrics,
  opts?: { frictionIndex?: number; context?: "Exploration" | "Execution" },
): SimplificationSnapshot {
  const psi = computePSI(metrics);
  const FI = opts?.frictionIndex ?? metrics.TF;
  const CSS = computeCSS(psi, FI);
  const SSS = computeSSS(CSS, opts?.context === "Execution" ? 0.95 : 1.05);

  const snapshot: SimplificationSnapshot = {
    workspace,
    timestamp: new Date().toISOString(),
    metrics: { ...metrics, PSI: psi, CSS, SSS, FI, DCI: metrics.DC },
    context: opts?.context ?? "Exploration",
  };
  return snapshot;
}
