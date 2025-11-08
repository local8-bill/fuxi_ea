"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import seed from "@/data/deckersCapabilities.json";

/** ---------- Types ---------- */
export type Level = "L1" | "L2" | "L3";

export type Scores = {
  opportunity: number;            // 1..5
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export type Weights = {
  opportunity: number;            // 0..1
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export const DEFAULT_SCORES: Scores = {
  opportunity: 3,
  maturity: 3,
  techFit: 3,
  strategicAlignment: 3,
  peopleReadiness: 3,
};

export const defaultWeights: Weights = {
  opportunity: 0.30,
  maturity: 0.20,
  techFit: 0.20,
  strategicAlignment: 0.20,
  peopleReadiness: 0.10,
};

export type Capability = {
  id: string;
  name: string;
  level: Level;
  parentId?: string;
  domain?: string;
  scores?: Scores;             // local scores
  overrideEnabled?: boolean;   // if true, use overrideScores instead of rollup/own
  overrideScores?: Scores;     // explicit override values
};

type CapabilityContext = {
  // data & structure
  data: Capability[];
  byId: Record<string, Capability>;
  children: Record<string, string[]>;
  roots: string[]; // all L1

  // selection
  openId: string | null;
  setOpenId: (id: string | null) => void;

  // scoring
  updateScore: (id: string, key: keyof Scores, value: number) => void;
  setOverrideEnabled: (id: string, enabled: boolean) => void;
  updateOverride: (id: string, key: keyof Scores, value: number) => void;

  // computations
  effectiveScores: (id: string) => Scores;             // override → own → rollup
  isOverridden: (id: string) => boolean;
  compositeFor: (id: string, weights?: Weights) => number;

  // filters
  query: string;
  setQuery: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  domains: string[];

  // weights
  weights: Weights;
  setWeights: (w: Weights) => void;

  // filtered list (IDs)
  filteredIds: string[];
};

const CapabilityCtx = createContext<CapabilityContext | null>(null);

/** ---------- Helpers ---------- */
function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function compositeScore(scores: Scores, weights: Weights) {
  return (
    scores.opportunity * weights.opportunity +
    scores.maturity * weights.maturity +
    scores.techFit * weights.techFit +
    scores.strategicAlignment * weights.strategicAlignment +
    scores.peopleReadiness * weights.peopleReadiness
  );
}

/** ---------- Provider ---------- */
export function CapabilityProvider({ children }: { children: ReactNode }) {
  // 1) load data
  const initial: Capability[] = useMemo(() => {
    // seed should already have id, name, level, parentId?, domain?
    // ensure scores shape exists
    const arr = (seed as any[]) ?? [];
    return arr.map((c: any, idx: number) => ({
      id: c.id ?? `cap_${idx}`,
      name: c.name ?? `Capability ${idx + 1}`,
      level: (c.level ?? "L1") as Level,
      parentId: c.parentId,
      domain: c.domain,
      scores: c.scores ?? { ...DEFAULT_SCORES },
    }));
  }, []);

  const [data, setData] = useState<Capability[]>(initial);

  // 2) maps
  const byId = useMemo(() => {
    const m: Record<string, Capability> = {};
    for (const c of data) m[c.id] = c;
    return m;
  }, [data]);

  const childrenMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const c of data) {
      if (c.parentId) {
        (m[c.parentId] ||= []).push(c.id);
      }
    }
    return m;
  }, [data]);

  const roots = useMemo(() => data.filter(d => d.level === "L1").map(d => d.id), [data]);

  // 3) selection
  const [openId, setOpenId] = useState<string | null>(null);

  // 4) scoring mutations
  const updateScore = useCallback((id: string, key: keyof Scores, value: number) => {
    setData(prev => prev.map(c => c.id === id
      ? { ...c, scores: { ...(c.scores ?? DEFAULT_SCORES), [key]: value } }
      : c
    ));
  }, []);

  const setOverrideEnabled = useCallback((id: string, enabled: boolean) => {
    setData(prev => prev.map(c => c.id === id
      ? { ...c, overrideEnabled: enabled, overrideScores: enabled ? (c.overrideScores ?? { ...DEFAULT_SCORES }) : c.overrideScores }
      : c
    ));
  }, []);

  const updateOverride = useCallback((id: string, key: keyof Scores, value: number) => {
    setData(prev => prev.map(c => {
      if (c.id !== id) return c;
      const base = c.overrideScores ?? { ...DEFAULT_SCORES };
      return { ...c, overrideScores: { ...base, [key]: value } };
    }));
  }, []);

  // 5) rollups & effective
  const rollupScores = useCallback((id: string): Scores => {
    const kids = childrenMap[id] ?? [];
    if (!kids.length) return byId[id].scores ?? { ...DEFAULT_SCORES };
    // average each dimension of *effective* child scores
    const kidScores = kids.map(k => effectiveScores(k));
    return {
      opportunity: avg(kidScores.map(s => s.opportunity)),
      maturity: avg(kidScores.map(s => s.maturity)),
      techFit: avg(kidScores.map(s => s.techFit)),
      strategicAlignment: avg(kidScores.map(s => s.strategicAlignment)),
      peopleReadiness: avg(kidScores.map(s => s.peopleReadiness)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenMap, byId]);

  const isOverridden = useCallback((id: string) => !!byId[id]?.overrideEnabled, [byId]);

  const effectiveScores = useCallback((id: string): Scores => {
    const node = byId[id];
    if (!node) return { ...DEFAULT_SCORES };
    if (node.overrideEnabled && node.overrideScores) return node.overrideScores;
    // leaf → own; parent → rollup; node with own but also children: still rollup
    const kids = childrenMap[id] ?? [];
    if (kids.length) return rollupScores(id);
    return node.scores ?? { ...DEFAULT_SCORES };
  }, [byId, childrenMap, rollupScores]);

  const [weights, setWeights] = useState<Weights>(defaultWeights);

  const compositeFor = useCallback((id: string, w?: Weights) => {
    return compositeScore(effectiveScores(id), w ?? weights);
  }, [effectiveScores, weights]);

  // 6) simple filters
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("All Domains");
  const domains = useMemo(() => {
    const s = new Set<string>();
    data.forEach(d => { if (d.domain) s.add(d.domain); });
    return Array.from(s).sort();
  }, [data]);

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter(c => (domain === "All Domains" ? true : c.domain === domain))
      .filter(c => (q ? c.name.toLowerCase().includes(q) : true))
      .map(c => c.id);
  }, [data, domain, query]);

  const value: CapabilityContext = {
    data, byId, children: childrenMap, roots,
    openId, setOpenId,
    updateScore, setOverrideEnabled, updateOverride,
    effectiveScores, isOverridden, compositeFor,
    query, setQuery, domain, setDomain, domains,
    weights, setWeights,
    filteredIds,
  };

  return <CapabilityCtx.Provider value={value}>{children}</CapabilityCtx.Provider>;
}

export function useCapabilities() {
  const ctx = useContext(CapabilityCtx);
  if (!ctx) throw new Error("useCapabilities must be used within CapabilityProvider");
  return ctx;
}
