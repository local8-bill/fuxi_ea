// src/features/capabilities/CapabilityProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";

import seed from "@/data/deckersCapabilities.json";
import {
  DEFAULT_SCORES,
  compositeScore,
  type Scores,
  type Weights,
  defaultWeights,
} from "@/features/capabilities/utils";

/** ---------- Types ---------- */
export interface Capability {
  id: string;
  name: string;
  domain?: string;
  level: "L1" | "L2" | "L3" | "L4";
  parentId?: string;
  scores?: Scores;
}

interface CapabilityContext {
  // data & indexes
  data: Capability[];
  byId: Record<string, Capability>;
  children: Record<string, string[]>;

  // filters (TopBar needs these)
  query: string;
  setQuery: (v: string) => void;
  domains: string[];
  domain: string;
  setDomain: (d: string) => void;

  // UI (optional, used by drawers/views if you wire them)
  openId: string | null;
  setOpenId: (id: string | null) => void;

  // scoring
  updateScore: (id: string, key: keyof Scores, value: number) => void;
  weights: Weights;
  setWeights: (w: Weights) => void;
  compositeFor: (cap: Capability) => number;

  // utils for TopBar
  exportJson: () => void;
  resetAllScores: () => void;
}

/** ---------- Context ---------- */
const CapabilityCtx = createContext<CapabilityContext | null>(null);

/** ---------- Provider ---------- */
export function CapabilityProvider({ children }: { children: ReactNode }) {
  /** load dataset (localStorage first, else seed) */
  const [data, setData] = useState<Capability[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("fuxi:dataset:v1");
        if (raw) return JSON.parse(raw) as Capability[];
      } catch {}
    }
    return seed as Capability[];
  });

  // filters (used by TopBar and any list views)
  const [query, setQuery] = useState("");
  const domains = useMemo(() => {
    const s = new Set<string>();
    for (const c of data) if (c.domain) s.add(c.domain);
    return ["All Domains", ...Array.from(s).sort()];
  }, [data]);
  const [domain, setDomain] = useState<string>("All Domains");

  // optional UI state
  const [openId, setOpenId] = useState<string | null>(null);

  // weights
  const [weights, setWeights] = useState<Weights>(defaultWeights);

  /** build lookup maps */
  const byId = useMemo(() => {
    const map: Record<string, Capability> = {};
    for (const c of data) map[c.id] = c;
    return map;
  }, [data]);

  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of data) {
      if (c.parentId) {
        (map[c.parentId] ||= []).push(c.id);
      }
    }
    return map;
  }, [data]);

  /** ---------- scoring updates ---------- */
  const updateScore = (id: string, key: keyof Scores, value: number) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              scores: { ...(c.scores ?? { ...DEFAULT_SCORES }), [key]: value },
            }
          : c
      )
    );
  };

  /** ---------- roll-up logic ---------- */
  const compositeFor = (cap: Capability): number => {
    const kids = childrenMap[cap.id];
    if (kids && kids.length > 0) {
      const vals = kids.map((id) => compositeFor(byId[id]));
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    return compositeScore(cap.scores ?? DEFAULT_SCORES, weights);
  };

  /** persist dataset on change */
  useEffect(() => {
    try {
      localStorage.setItem("fuxi:dataset:v1", JSON.stringify(data));
    } catch {}
  }, [data]);

  /** ---------- utilities for TopBar ---------- */
  const exportJson = () => {
    try {
      const payload = JSON.stringify(
        {
          data,
          weights,
          meta: { exportedAt: new Date().toISOString(), domainFilter: domain, query },
        },
        null,
        2
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "capabilities-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const resetAllScores = () => {
    setData((prev) =>
      prev.map((c) => ({
        ...c,
        // reset scores everywhere; feel free to scope to leaves only if preferred
        scores: { ...DEFAULT_SCORES },
      }))
    );
    try {
      // keep dataset but clear any separate score caches if you add them later
      // localStorage.removeItem("fuxi:scores:v1");
    } catch {}
  };

  /** ---------- provide context ---------- */
  const value: CapabilityContext = {
    data,
    byId,
    children: childrenMap,
    query,
    setQuery,
    domains,
    domain,
    setDomain,
    openId,
    setOpenId,
    updateScore,
    weights,
    setWeights,
    compositeFor,
    exportJson,
    resetAllScores,
  };

  return (
    <CapabilityCtx.Provider value={value}>{children}</CapabilityCtx.Provider>
  );
}

/** ---------- Hook ---------- */
export function useCapabilities(): CapabilityContext {
  const ctx = useContext(CapabilityCtx);
  if (!ctx) throw new Error("useCapabilities must be used within CapabilityProvider");
  return ctx;
}

export default CapabilityProvider;