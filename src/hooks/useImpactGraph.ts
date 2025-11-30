"use client";

import { useMemo } from "react";
import type { ImpactGraphData, SystemNode, IntegrationEdge } from "@/types/impactGraph";

type UseImpactGraphResult = ImpactGraphData & { error?: string | null };

/**
 * Build a lightweight graph from available system stats.
 * Future: replace mock data with real `.fuxi/data/digital-enterprise` ingestion.
 */
export function useImpactGraph(): UseImpactGraphResult {
  const nodes = useMemo<SystemNode[]>(
    () => [
      { id: "input", label: "Input", domain: "Ingress", impactScore: 72, readiness: 60 },
      { id: "n2", label: "Node 2", domain: "Core Ops", impactScore: 68, readiness: 55 },
      { id: "n3", label: "Node 3", domain: "Core Ops", impactScore: 70, readiness: 58 },
      { id: "n2a", label: "Node 2a", domain: "Data", impactScore: 62, readiness: 52 },
      { id: "n2b", label: "Node 2b", domain: "Experience", impactScore: 64, readiness: 50 },
      { id: "n2c", label: "Node 2c", domain: "Experience", impactScore: 58, readiness: 48 },
      { id: "n2d", label: "Node 2d", domain: "Experience", impactScore: 55, readiness: 45 },
      { id: "n4", label: "Node 4", domain: "Data", impactScore: 60, readiness: 50 },
      { id: "n5", label: "Node 5", domain: "Data", impactScore: 57, readiness: 47 },
      { id: "out1", label: "Output", domain: "Egress", impactScore: 54, readiness: 46 },
      { id: "out2", label: "Output", domain: "Egress", impactScore: 52, readiness: 44 },
    ],
    [],
  );

  const edges = useMemo<IntegrationEdge[]>(
    () => [
      { id: "e-input-n3", source: "input", target: "n3", weight: 4 },
      { id: "e-input-n2", source: "input", target: "n2", weight: 3 },
      { id: "e-n3-n2a", source: "n3", target: "n2a", weight: 2 },
      { id: "e-n2-n2b", source: "n2", target: "n2b", weight: 2 },
      { id: "e-n2-n2c", source: "n2", target: "n2c", weight: 2 },
      { id: "e-n2c-n2d", source: "n2c", target: "n2d", weight: 1 },
      { id: "e-n4-n5", source: "n4", target: "n5", weight: 1 },
      { id: "e-n5-out1", source: "n5", target: "out1", weight: 1 },
      { id: "e-n5-out2", source: "n5", target: "out2", weight: 1 },
    ],
    [],
  );

  const data = useMemo<ImpactGraphData>(() => ({ nodes, edges }), [nodes, edges]);
  return { ...data, error: null };
}
