export type Level = "L1" | "L2" | "L3";

export type Scores = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export type Capability = {
  id: string;
  name: string;
  level: Level;
  parentId?: string;         // optional (useful later for DB adapters)
  domain?: string;           // usually set on L1 but allowed anywhere
  scores?: Partial<Scores>;
  children?: Capability[];   // NEW: nested L2/L3
  attributes?: Record<string, unknown>;
};