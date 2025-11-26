"use client";

import { useEffect, useMemo, useState } from "react";

export type AIInsight = {
  id: string;
  label: string;
  aiReadiness: number;
  opportunityScore: number;
  riskScore: number;
  summary?: string;
};

type RemoteInsightPayload = {
  nodes?: Array<Record<string, any>>;
};

function scoreFromString(input: string, offset = 0): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  const normalized = Math.abs(hash + offset) % 55; // 0-54
  return 40 + normalized; // 40-95
}

function toInsight(node: { id?: string; label?: string; raw?: any }, fallbackLabel?: string): AIInsight {
  const label = node.label || fallbackLabel || node.id || "Unknown";
  const key = node.id || label;
  const aiReadiness = scoreFromString(key, 7);
  const opportunityScore = scoreFromString(key, 17);
  const riskScore = scoreFromString(key, 31);
  return {
    id: key,
    label,
    aiReadiness,
    opportunityScore,
    riskScore,
    summary: node.raw?.Comments || `AI modernization opportunity for ${label}`,
  };
}

type InputNode = { id: string; label?: string };

export function useAIInsights(sourceNodes: InputNode[]) {
  const [remoteMap, setRemoteMap] = useState<Record<string, AIInsight>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/digital-enterprise/insights", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as RemoteInsightPayload;
        const mapped: Record<string, AIInsight> = {};
        (json.nodes ?? []).forEach((n, idx) => {
          const insight = toInsight(n, `Insight ${idx + 1}`);
          mapped[insight.id] = insight;
        });
        if (!cancelled) {
          setRemoteMap(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[AI-INSIGHTS] falling back to local scores", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const insights = useMemo(() => {
    const output: Record<string, AIInsight> = {};
    sourceNodes.forEach((n, idx) => {
      const fromRemote =
        remoteMap[n.id] ||
        Object.values(remoteMap).find(
          (ri) => ri.label?.toLowerCase() === (n.label ?? "").toLowerCase()
        );
      const fallback = toInsight({ id: n.id, label: n.label }, `Node ${idx + 1}`);
      output[n.id] = { ...fallback, ...(fromRemote ?? {}) };
    });
    return output;
  }, [sourceNodes, remoteMap]);

  return { insights, loading };
}
