export type SystemNode = {
  id: string;
  label: string;
  domain?: string | null;
  impactScore?: number;
  readiness?: number;
  integrationCount?: number;
};

export type IntegrationEdge = {
  id: string;
  source: string;
  target: string;
  weight?: number;
};

export type ImpactGraphData = {
  nodes: SystemNode[];
  edges: IntegrationEdge[];
};
