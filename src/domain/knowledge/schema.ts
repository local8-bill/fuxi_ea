// Core schemas for the Knowledge Domain layer (Directive 0002a).

export type FrictionZone = "repetitive_tasks" | "skill_bottlenecks" | "navigating_ambiguity";

export type AIPrimitiveId =
  | "content_creation"
  | "research"
  | "coding"
  | "data_analysis"
  | "ideation_strategy"
  | "automation";

export interface AIPrimitiveDefinition {
  id: AIPrimitiveId;
  name: string;
  description: string;
  exampleOutputs?: string[];
}

export interface ImpactEffortScore {
  impact: number;   // 0-100
  effort: number;   // 0-100
  readiness?: number; // 0-100
  notes?: string;
}

export type ImpactEffortQuadrant =
  | "quick_win"
  | "strategic_investment"
  | "self_service"
  | "deprioritize";

export interface ImpactEffortResult extends ImpactEffortScore {
  quadrant: ImpactEffortQuadrant;
}

export interface Opportunity {
  id: string;
  title: string;
  summary: string;
  frictionZones: FrictionZone[];
  primitives: AIPrimitiveId[];
  impactEffort: ImpactEffortResult;
  aiOpportunityIndex: number;
  tags?: string[];
  source?: string;
}

export interface MetricResult {
  id: string;
  name: string;
  value: number;
  unit?: string;
  description?: string;
  source?: string;
}

export interface IndustryCase {
  id: string;
  industry: string;
  challenge: string;
  primitives: AIPrimitiveId[];
  frictionZones: FrictionZone[];
  notes?: string;
}
