// src/domain/services/roiCalculator.ts

/**
 * Interface representing inputs for Total Cost of Change (TCC) calculation
 */
export interface TCCInputs {
  systemId: string;
  baseStageCost: number; // Derived from harmonization (C_stage)
  integrationCount: number; // DL_i
  integrationCost: number; // C_integration
  dualRunPenalty?: number; // LegacyPenalty, optional multiplier
  resourceHeadcount: number; // HR_i
  hourlyRate: number; // R_i
  durationHours: number; // D_i
  operationalImpactPercent?: number; // as % of domain revenue
  domainRevenue?: number; // revenue baseline for ops calc
  riskFactor?: number; // 0–1 scale for project risk
  governancePercent?: number; // org baseline, default 0.1
}

/**
 * Interface representing TCC calculation results
 */
export interface TCCResult {
  total: number;
  stageCost: number;
  resources: number;
  operational: number;
  risk: number;
  governance: number;
}

/**
 * Calculates the Total Cost of Change (TCC) for a given system or domain stage.
 * Implements math_explainers_tcc.md logic.
 */
export function totalCostOfChange(input: TCCInputs): TCCResult {
  const {
    baseStageCost,
    integrationCount,
    integrationCost,
    dualRunPenalty = 0,
    resourceHeadcount,
    hourlyRate,
    durationHours,
    operationalImpactPercent = 0,
    domainRevenue = 0,
    riskFactor = 0.1,
    governancePercent = 0.08,
  } = input;

  // Stage cost: system base + integration + dual-run
  const stageCost = baseStageCost + integrationCount * integrationCost + dualRunPenalty * baseStageCost;

  // Resource cost: HR × rate × duration
  const resources = resourceHeadcount * hourlyRate * durationHours;

  // Operational impact cost: % of domain revenue
  const operational = (operationalImpactPercent / 100) * domainRevenue;

  // Risk and governance overlays
  const risk = riskFactor * (stageCost + resources);
  const governance = governancePercent * (stageCost + resources);

  const total = stageCost + resources + operational + risk + governance;

  return {
    total,
    stageCost,
    resources,
    operational,
    risk,
    governance,
  };
}

/**
 * Example Usage:
 * const tcc = totalCostOfChange({
 *   systemId: 'ERP-NG',
 *   baseStageCost: 450000,
 *   integrationCount: 4,
 *   integrationCost: 15000,
 *   dualRunPenalty: 0.2,
 *   resourceHeadcount: 10,
 *   hourlyRate: 150,
 *   durationHours: 480,
 *   operationalImpactPercent: 2,
 *   domainRevenue: 4000000,
 *   riskFactor: 0.1,
 *   governancePercent: 0.08
 * });
 *
 * console.log(tcc.total); // => Total cost of change
 */

