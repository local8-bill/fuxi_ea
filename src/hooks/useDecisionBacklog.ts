"use client";

import { useMemo, useState } from "react";
import decisionNodesData from "@/data/graph/decision_nodes.json";

export type DecisionNode = {
  id: string;
  title: string;
  description: string;
  tcc: number;
  roi: number;
  roc: number;
  timeline: string;
  region: string[];
  stakeholder_support: Record<string, number>;
  tags: string[];
  rationale: string;
};

const ALL_NODES = decisionNodesData as DecisionNode[];

export function useDecisionBacklog() {
  const [error] = useState<string | null>(null);
  const nodes = useMemo(() => ALL_NODES, []);
  return { nodes, loading: false, error };
}
