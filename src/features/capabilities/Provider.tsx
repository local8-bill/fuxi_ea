"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { DEFAULT_SCORES, defaultWeights, compositeScore, average, type Level, type Scores, type Weights } from "@/lib/scoring";
import seed from "@/data/templates/retail.json";

export interface Capability {
  id: string;
  name: string;
  level: Level;
  parentId?: string;
  domain?: string;
  scores?: Scores;
  overrideEnabled?: boolean;
  overrideScores?: Scores;
  ai_rationale?: string;
  confidence?: number;
  last_assessed?: string;
  assessment_mode?: "manual" | "ai_conversational" | "ai_batch";
}

type Ctx = {
  data: Capability[];
  byId: Record<string, Capability>;
  children: Record<string, string[]>;
  roots: string[];

  openId: string | null;
  setOpenId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  query: string;
  setQuery: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  domains: string[];
  view: "grid" | "heat";
  setView: (v: "grid" | "heat") => void;

  sortBy: "name" | "score" | "domain";
  setSortBy: (v: "name" | "score" | "domain") => void;

  weights: Weights;
  setWeights: (w: Weights) => void;

  effectiveScores: (id: string) => Scores;
  compositeFor: (id: string, w?: Weights) => number;

  updateScore: (id: string, key: keyof Scores, value: number) => void;
  setOverrideEnabled: (id: string, enabled: boolean) => void;
  updateOverride: (id: string, key: keyof Scores, value: number) => void;
};

const CapabilityCtx = createContext<Ctx | null>(null);

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Capability[]>(() => (seed as any) as Capability[]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("All Domains");
  const [view, setView] = useState<"grid" | "heat">("grid");
  const [sortBy, setSortBy] = useState<"name" | "score" | "domain">("name");
  const [weights, setWeights] = useState<Weights>(defaultWeights);

  const byId = useMemo(() => {
    const m: Record<string, Capability> = {};
    data.forEach((c) => (m[c.id] = c));
    return m;
  }, [data]);

  const childrenMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    data.forEach((c) => {
      if (c.parentId) (m[c.parentId] ||= []).push(c.id);
    });
    return m;
  }, [data]);

  const roots = useMemo(() => data.filter((d) => d.level === "L1").map((d) => d.id), [data]);

  const effectiveScores = useCallback(
    (id: string): Scores => {
      const node = byId[id];
      if (!node) return { ...DEFAULT_SCORES };
      if (node.overrideEnabled && node.overrideScores) return node.overrideScores;

      const kids = childrenMap[id] ?? [];
      if (kids.length) {
        const kidScores = kids.map((k) => effectiveScores(k));
        return {
          opportunity: average(kidScores.map((s) => s.opportunity)),
          maturity: average(kidScores.map((s) => s.maturity)),
          techFit: average(kidScores.map((s) => s.techFit)),
          strategicAlignment: average(kidScores.map((s) => s.strategicAlignment)),
          peopleReadiness: average(kidScores.map((s) => s.peopleReadiness)),
        };
      }

      return node.scores ?? { ...DEFAULT_SCORES };
    },
    [byId, childrenMap]
  );

  const compositeFor = useCallback(
    (id: string, w?: Weights) => compositeScore(effectiveScores(id), w ?? weights),
    [effectiveScores, weights]
  );

  const updateScore = useCallback((id: string, key: keyof Scores, value: number) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, scores: { ...(c.scores ?? DEFAULT_SCORES), [key]: value } } : c
      )
    );
  }, []);

  const setOverrideEnabled = useCallback((id: string, enabled: boolean) => {
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, overrideEnabled: enabled } : c)));
  }, []);

  const updateOverride = useCallback((id: string, key: keyof Scores, value: number) => {
    setData((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const base = c.overrideScores ?? { ...DEFAULT_SCORES };
        return { ...c, overrideScores: { ...base, [key]: value } };
      })
    );
  }, []);

  const domains = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => d.domain && s.add(d.domain));
    return ["All Domains", ...Array.from(s).sort()];
  }, [data]);

  const value: Ctx = {
    data,
    byId,
    children: childrenMap,
    roots,

    openId,
    setOpenId,
    selectedId,
    setSelectedId,

    query,
    setQuery,
    domain,
    setDomain,
    domains,
    view,
    setView,

    sortBy,
    setSortBy,

    weights,
    setWeights,

    effectiveScores,
    compositeFor,
    updateScore,
    setOverrideEnabled,
    updateOverride,
  };

  return <CapabilityCtx.Provider value={value}>{children}</CapabilityCtx.Provider>;
}

export function useCapabilities(): Ctx {
  const ctx = useContext(CapabilityCtx);
  if (!ctx) throw new Error("useCapabilities must be used within CapabilityProvider");
  return ctx;
}
