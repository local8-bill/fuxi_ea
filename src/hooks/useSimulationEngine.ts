"use client";

import { useMemo, useState } from "react";
import type { LivingMapData, SimulationMode, SimulationState } from "@/types/livingMap";

type UseSimulationEngineResult = {
  data: LivingMapData;
  state: SimulationState;
  setMode: (mode: SimulationMode) => void;
  toggleNode: (id: string) => void;
};

export function useSimulationEngine(base: LivingMapData): UseSimulationEngineResult {
  const [mode, setMode] = useState<SimulationMode>("inspect");
  const [disabledNodes, setDisabledNodes] = useState<Set<string>>(new Set());

  const state: SimulationState = { mode, disabledNodes };

  const data = useMemo(() => {
    // In simulate mode, mark disabled nodes and fade edges touching them.
    if (mode !== "simulate") return base;

    const disabled = disabledNodes;
    const nodes = base.nodes.map((n) =>
      disabled.has(n.id) ? { ...n, health: 0, aiReadiness: 0 } : n,
    );

    const edges = base.edges.map((e) => {
      if (disabled.has(e.source) || disabled.has(e.target)) {
        return { ...e, weight: (e.weight ?? 1) * 0.2 };
      }
      return e;
    });

    return { nodes, edges };
  }, [base, mode, disabledNodes]);

  const toggleNode = (id: string) => {
    setDisabledNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return { data, state, setMode, toggleNode };
}
