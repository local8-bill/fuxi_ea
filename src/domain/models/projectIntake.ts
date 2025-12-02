export type Industry =
  | "retail"
  | "consumer"
  | "manufacturing"
  | "financial-services"
  | "healthcare"
  | "technology"
  | "public-sector"
  | "other";

export type StrategyDriver =
  | "grow-revenue"
  | "reduce-cost"
  | "modernize-tech"
  | "improve-cx"
  | "increase-speed"
  | "harmonize-data"
  | "expand-globally"
  | "reduce-risk"
  | "ma-readiness";

export type TransformationAttitude = "steady" | "balanced" | "aggressive";

export type ChangeCapacity = "low" | "normal" | "high";

export interface SacredSystem {
  id: string;
  name: string;
}

export type OpportunityZone =
  | "ecommerce"
  | "supply-chain"
  | "data"
  | "integration"
  | "martech"
  | "erp-adjacent"
  | "customer-service"
  | "analytics";

export interface ProjectIntake {
  projectId: string;
  industry: Industry | null;
  customIndustry?: string | null;
  strategyDrivers: StrategyDriver[];
  transformationAttitude: TransformationAttitude | null;
  sacredSystems: SacredSystem[];
  opportunityZones: OpportunityZone[];
  changeCapacity: ChangeCapacity | null;
  notes?: string | null;
}
