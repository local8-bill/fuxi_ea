export type LivingNode = {
  id: string;
  label: string;
  domain?: string | null;
  owner?: string | null;
  costPerformanceRatio?: number;
  aiReadiness?: number;
  redundancyScore?: number;
  health?: number;
  integrationCount?: number;
};

export type LivingEdge = {
  id: string;
  source: string;
  target: string;
  weight?: number;
  kind?: "api" | "data" | "workflow" | "manual";
  latencyMs?: number;
  throughput?: number;
};

export type LivingMapData = {
  nodes: LivingNode[];
  edges: LivingEdge[];
};

export type SimulationMode = "inspect" | "simulate" | "optimize";

export type SimulationState = {
  mode: SimulationMode;
  disabledNodes: Set<string>;
};

export type SimulationEvent = {
  id: string;
  timestamp: string;
  type: "system_decommissioned" | "integration_relinked" | "system_golive" | "domain_modernized";
  title: string;
  detail: string;
  domain?: string;
  severity?: "info" | "warning" | "critical";
};
