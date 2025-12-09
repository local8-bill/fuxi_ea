"use client";

import { useCallback, useEffect, useState } from "react";

export type LearningMetrics = {
  risk: number;
  confidence: number;
  velocity: number;
  maturity: number;
};

export type LearningSnapshot = {
  metrics?: LearningMetrics | null;
  narrative?: string | null;
  updatedAt?: string | null;
};

export function useLearningSnapshot(projectId: string) {
  const [snapshot, setSnapshot] = useState<LearningSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSnapshot = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/learning/metrics?projectId=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setSnapshot({
          metrics: json?.metrics ?? null,
          narrative: json?.narrative ?? null,
          updatedAt: json?.updatedAt ?? null,
        });
      } else {
        setSnapshot(null);
      }
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  return { snapshot, loading, refresh: fetchSnapshot };
}
