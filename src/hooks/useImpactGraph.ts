"use client";

import { useMemo } from "react";
import type { ImpactGraphData, SystemNode, IntegrationEdge } from "@/types/impactGraph";
import { digitalEnterpriseSystems } from "@/mock/dashboardData";

type UseImpactGraphResult = ImpactGraphData & { error?: string | null };

/**
 * Build a lightweight graph from available system stats.
 * Future: replace mock data with real `.fuxi/data/digital-enterprise` ingestion.
 */
export function useImpactGraph(): UseImpactGraphResult {
  // Mock nodes from existing dashboard data
  const domains = ["Core Ops", "Experience", "Data", "Commerce"];
  const nodes: SystemNode[] = digitalEnterpriseSystems.map((s, idx) => ({
    id: `sys-${idx}`,
    label: s.name,
    impactScore: s.criticality * 100,
    readiness: 50 + idx * 5,
    integrationCount: s.integrations,
    domain: domains[idx % domains.length],
  }));

  // Simple fan-out edges to simulate dependencies
  const edges: IntegrationEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      weight: (nodes[i].integrationCount ?? 1) / 2,
    });
  }

  const data = useMemo<ImpactGraphData>(() => ({ nodes, edges }), [nodes, edges]);
  return { ...data, error: null };
}
