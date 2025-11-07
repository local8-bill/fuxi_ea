// src/features/capabilities/AdhocProjectScoringProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Capability, Project, Scores, Weights } from "@/types/project";
import { DEFAULT_SCORES, defaultWeights, compositeScore } from "@/features/capabilities/utils";

type Ctx = {
  // data
  data: Capability[];
  byId: Record<string, Capability>;
  children: Record<string, string[]>;
  // filters
  query: string; setQuery: (v: string)=>void;
  domain: string; setDomain: (v: string)=>void;
  domains: string[];
  // scoring
  weights: Weights; setWeights: (w: Weights)=>void;
  updateScore: (id: string, key: keyof Scores, value: number)=>void;
  compositeFor: (c: Capability)=>number;
  resetAllScores: ()=>void;
  exportJson: ()=>void;
  // drawer
  openId: string | null; setOpenId: (id: string | null)=>void;
};

const C = createContext<Ctx | null>(null);
export const useCapabilities = () => { const v = useContext(C); if (!v) throw new Error("useCapabilities outside provider"); return v; };

export default function AdhocProjectScoringProvider({
  projectId,
  initialProject,
  children: ui,
}: {
  projectId: string;
  initialProject: Project;
  children: React.ReactNode;
}) {
  // keep a local working copy and persist back
  const [project, setProject] = useState<Project>(initialProject);

  // persist on any change
  useEffect(() => {
    const p = { ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } };
    localStorage.setItem(`fuxi:projects:${projectId}`, JSON.stringify(p));
  }, [projectId, project]);

  const data = project.capabilities;
  const byId = useMemo(()=>Object.fromEntries(data.map(c=>[c.id, c])), [data]);
  const children = useMemo(()=>{
    const m: Record<string,string[]> = {};
    for (const c of data) if (c.parentId) (m[c.parentId] ||= []).push(c.id);
    return m;
  }, [data]);

  // filters
  const [query, setQuery] = useState("");
  const domains = useMemo(()=>["All Domains", ...Array.from(new Set(data.map(d=>d.domain).filter(Boolean) as string[])).sort()], [data]);
  const [domain, setDomain] = useState<string>("All Domains");

  // weights
  const [weights, setWeights] = useState<Weights>(project.weights || defaultWeights);
  useEffect(() => setProject(p => ({ ...p, weights })), [weights]);

  // scoring updates
  const updateScore = (id: string, key: keyof Scores, value: number) => {
    setProject(p => ({
      ...p,
      capabilities: p.capabilities.map(c =>
        c.id === id ? { ...c, scores: { ...(c.scores ?? { ...DEFAULT_SCORES }), [key]: value } } : c
      )
    }));
  };

  // rollup
  const compositeFor = (c: Capability): number => {
    const kids = children[c.id];
    if (kids?.length) {
      const vals = kids.map(k => compositeFor(byId[k]));
      return vals.reduce((a,b)=>a+b,0) / vals.length;
    }
    return compositeScore(c.scores ?? DEFAULT_SCORES, weights);
  };

  // drawer
  const [openId, setOpenId] = useState<string|null>(null);

  const resetAllScores = () => {
    setProject(p => ({
      ...p,
      capabilities: p.capabilities.map(c => ({ ...c, scores: undefined }))
    }));
  };

  const exportJson = () => {
    const payload = project.capabilities.map(c => ({
      id: c.id, name: c.name, level: c.level, domain: c.domain, parentId: c.parentId, scores: c.scores ?? null
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.meta.name.replace(/\s+/g,'_')}_scores.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const value: Ctx = {
    data, byId, children,
    query, setQuery, domain, setDomain, domains,
    weights, setWeights, updateScore, compositeFor, resetAllScores, exportJson,
    openId, setOpenId,
  };

  return <C.Provider value={value}>{ui}</C.Provider>;
}