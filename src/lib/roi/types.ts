export type RoiTargets = {
  targetId: string;
  projectId: string;
  sequenceId?: string;
  hypothesis?: string;
  deadlineYear?: number;
  budgetCeiling?: number;
  capexPreference?: number;
  headcountEnvelope?: number;
  blackoutStart?: string;
  blackoutEnd?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RoiAssumptions = {
  assumptionsId: string;
  projectId: string;
  sequenceId?: string;
  integrationCost?: number;
  governancePercent?: number;
  riskFactor?: number;
  hourlyRate?: number;
  roleRates?: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
};

export type FeasibilityConstraint = {
  code: "deadline" | "budget" | "capacity" | "blackout" | "inputs";
  label: string;
  detail?: string;
  delta?: number;
};

export type RoiFeasibilityReport = {
  reportId: string;
  projectId: string;
  sequenceId?: string;
  generatedAt: string;
  status: "feasible" | "feasible_with_risk" | "infeasible";
  constraints: FeasibilityConstraint[];
};
