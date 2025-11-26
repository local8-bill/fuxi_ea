"use client";

import roi from "../../docs/models/roi_calculation.json";
import capability from "../../docs/models/capability_scoring.json";
import aiReadiness from "../../docs/models/ai_readiness.json";
import portfolio from "../../docs/models/portfolio_optimization.json";

export type ModelMetadata = {
  modelName: string;
  modelType: string;
  purpose: string;
  inputs: string[];
  formulaSummary: string;
  assumptions: string[];
  confidenceLevel: string;
  referenceDocs?: string;
  author?: string;
  lastUpdated?: string;
};

const registry: Record<string, ModelMetadata> = {
  roi_calculation: roi,
  capability_scoring: capability,
  ai_readiness: aiReadiness,
  portfolio_optimization: portfolio,
};

export function getModelMetadata(modelName: string): ModelMetadata | null {
  const key = modelName.toLowerCase();
  if (registry[key]) return registry[key];
  // try exact match
  const entry = Object.entries(registry).find(([k, v]) => v.modelName.toLowerCase() === key);
  return entry ? entry[1] : null;
}
