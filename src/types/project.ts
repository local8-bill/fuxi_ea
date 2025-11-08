// src/types/project.ts
export type Level = "L1" | "L2" | "L3" | "L4";

export type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

export type Capability = {
  id: string;
  name: string;
  level: Level;
  parentId?: string;
  domain?: string;
  description?: string;
  aliases?: string[];
  scores?: Scores;
};

export type Weights = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

export type ProjectMeta = {
  id: string;
  name: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  meta: ProjectMeta;
  capabilities: Capability[];
  weights: Weights;
};