"use client";
import React, { useState } from "react";
import type { Weights } from "@/lib/scoring";

export function HeaderBar({
  query, setQuery, domain, setDomain, domains,
  view, setView, weights, setWeights,
  sortBy, setSortBy
}: {
  query:string; setQuery:(v:string)=>void;
  domain:string; setDomain:(v:string)=>void;
  domains:string[];
  view:"grid"|"heat"; setView:(v:"grid"|"heat")=>void;
  weights:Weights; setWeights:(w:Weights)=>void;
  sortBy:"name"|"score"|"domain"; setSortBy:(v:"name"|"score"|"domain")=>void;
}) {
  const [showWeights, setShowWeights] = useState(false);
  const weightKeys = ["opportunity","maturity","techFit","strategicAlignment","peopleReadiness"] as const;

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input w-[260px]"
          placeholder="Search capabilities…"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />

        <select className="select" value={domain} onChange={(e)=>setDomain(e.target.value)}>
          {domains.map((d)=> <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="select" value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
          <option value="name">Sort: Name</option>
          <option value="score">Sort: Score</option>
          <option value="domain">Sort: Domain</option>
        </select>

        <div className="ml-auto flex gap-1">
          <button className={`btn ${view==="grid"?"btn-primary":""}`} onClick={()=>setView("grid")}>Grid</button>
          <button className={`btn ${view==="heat"?"btn-primary":""}`} onClick={()=>setView("heat")}>Heatmap</button>
          <button className="btn" onClick={()=>setShowWeights(!showWeights)}>Weights</button>
        </div>
      </div>

      {showWeights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weightKeys.map((key)=> (
            <div key={key} className="card">
              <div className="mb-1 font-medium capitalize">{key}</div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((weights as any)[key]*100)}
                onChange={(e)=>{
                  const pct = Number(e.target.value)/100;
                  setWeights({ ...weights, [key]: pct } as Weights);
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}