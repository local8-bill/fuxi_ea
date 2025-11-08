"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import seed from "@/data/deckersCapabilities.json";
import {
  DEFAULT_SCORES,
  defaultWeights,
  compositeScore,
  type Scores,
  type Weights,
} from "@/features/capabilities/utils";

export type Level = "L1" | "L2" | "L3";
export type Capability = {
  id: string; name: string; level: Level;
  parentId?: string; domain?: string;
  scores?: Scores;
};

type Ctx = {
  data: Capability[];
  byId: Record<string, Capability>;
  children: Record<string, string[]>;
  roots: string[];
  openId: string|null;
  setOpenId: (id:string|null)=>void;

  query: string; setQuery:(v:string)=>void;
  domain: string; setDomain:(v:string)=>void;
  domains: string[];
  weights: Weights; setWeights:(w:Weights)=>void;
  view: "grid"|"heat"; setView:(v:"grid"|"heat")=>void;

  effectiveScores: (id:string)=>Scores;
  compositeFor: (id:string, w?:Weights)=>number;
  updateScore: (id:string, key:keyof Scores, value:number)=>void;
};

const CapabilityCtx = createContext<Ctx|null>(null);
const avg = (xs:number[]) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;

export function CapabilityProvider({ projectId, children }:{ projectId:string, children:React.ReactNode }) {
  const initial = useMemo(()=> {
    const arr = (seed as any[]) ?? [];
    return arr.map((c:any, i:number)=> ({
      id: c.id ?? `cap_${i}`,
      name: c.name ?? `Capability ${i+1}`,
      level: (c.level ?? "L1") as Level,
      parentId: c.parentId,
      domain: c.domain,
      scores: c.scores ?? { ...DEFAULT_SCORES },
    }));
  }, []);

  const [data, setData] = useState(initial);
  const [openId, setOpenId] = useState<string|null>(null);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("All Domains");
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [view, setView] = useState<"grid"|"heat">("grid");

  const byId = useMemo(()=> {
    const m:Record<string, any> = {};
    data.forEach(c=> m[c.id]=c);
    return m;
  }, [data]);

  const children = useMemo(()=> {
    const m:Record<string, string[]> = {};
    data.forEach(c => { if (c.parentId) (m[c.parentId] ||= []).push(c.id); });
    return m;
  }, [data]);

  const roots = useMemo(()=> data.filter(d=>d.level==="L1").map(d=>d.id), [data]);

  const effectiveScores = useCallback((id:string):Scores => {
    const node = byId[id];
    if (!node) return { ...DEFAULT_SCORES };
    const kids = children[id] ?? [];
    if (!kids.length) return node.scores ?? { ...DEFAULT_SCORES };
    const sc = kids.map(k => effectiveScores(k));
    return {
      opportunity: avg(sc.map(s=>s.opportunity)),
      maturity: avg(sc.map(s=>s.maturity)),
      techFit: avg(sc.map(s=>s.techFit)),
      strategicAlignment: avg(sc.map(s=>s.strategicAlignment)),
      peopleReadiness: avg(sc.map(s=>s.peopleReadiness)),
    };
  }, [byId, children]);

  const compositeFor = useCallback((id:string, w?:Weights)=> {
    return compositeScore(effectiveScores(id), w ?? weights);
  }, [effectiveScores, weights]);

  const updateScore = useCallback((id:string, key:keyof Scores, value:number)=> {
    setData(prev => prev.map(c => c.id===id
      ? { ...c, scores: { ...(c.scores ?? DEFAULT_SCORES), [key]: value } }
      : c
    ));
  }, []);

  const domains = useMemo(()=> {
    const s = new Set<string>(); data.forEach(d=> d.domain && s.add(d.domain));
    return Array.from(s).sort();
  }, [data]);

  return (
    <CapabilityCtx.Provider value={{
      data, byId, children, roots,
      openId, setOpenId,
      query, setQuery, domain, setDomain, domains,
      weights, setWeights, view, setView,
      effectiveScores, compositeFor, updateScore
    }}>
      {children}
    </CapabilityCtx.Provider>
  );
}

export function useCapabilities(): Ctx {
  const ctx = React.useContext(CapabilityCtx);
  if (!ctx) throw new Error("useCapabilities must be used within CapabilityProvider");
  return ctx;
}
