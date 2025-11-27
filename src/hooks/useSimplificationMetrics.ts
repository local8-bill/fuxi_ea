"use client";

import React from "react";
import type { CognitiveMetrics } from "@/domain/models/uxMetrics";
import { buildSnapshot } from "@/lib/telemetry/simplificationProcessor";

type UseSimplificationMetricsResult = {
  snapshot: ReturnType<typeof buildSnapshot> | null;
  setMetrics: (m: Partial<CognitiveMetrics>) => void;
};

export function useSimplificationMetrics(workspace: string): UseSimplificationMetricsResult {
  const [metrics, setMetricsState] = React.useState<CognitiveMetrics>({
    CL: 0.68,
    TF: 1.1,
    ID: 0.94,
    DC: 0.63,
  });

  const setMetrics = (patch: Partial<CognitiveMetrics>) => {
    setMetricsState((prev) => ({ ...prev, ...patch }));
  };

  const snapshot = React.useMemo(() => {
    try {
      return buildSnapshot(workspace, metrics, { context: "Exploration" });
    } catch {
      return null;
    }
  }, [workspace, metrics]);

  return { snapshot, setMetrics };
}
