export type Level = "L1" | "L2" | "L3" | "L4";

export type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

export type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export type Capability = {
  id: string;
  domain: string;
  level: Level;
  l1: string;
  l2?: string;
  l3?: string;
  l4?: string;
  name: string;
  parentId?: string;
  scores?: Scores;
};
