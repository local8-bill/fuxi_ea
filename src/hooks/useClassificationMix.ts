"use client";

import { useEffect, useState } from "react";

export type ClassificationDefinition = {
  name: string;
  description: string;
  risk_weight: number;
  sequencer_wave: number;
  roi_focus: string;
  telemetry_tag: string;
};

type ClassificationResponse = {
  mix: Record<string, number>;
  definitions: ClassificationDefinition[];
};

export function useClassificationMix(projectId: string) {
  const [data, setData] = useState<ClassificationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/inventory/classifications?projectId=${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load classification mix");
        const json = (await res.json()) as ClassificationResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { data, loading };
}
