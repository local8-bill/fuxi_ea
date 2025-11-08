"use client";
import React from "react";
import type { Weights } from "@/features/capabilities/utils";

export function TopBar({
  view, setView,
  query, setQuery,
  domain, setDomain, domains,
  weights, setWeights,
}: {
  view:"grid"|"heat"; setView:(v:"grid"|"heat")=>void;
  query:string; setQuery:(v:string)=>void;
  domain:string; setDomain:(v:string)=>void;
  domains:string[];
  weights:Weights; setWeights:(w:Weights)=>void;
}) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="font-semibold">Project Scoring</div>
        <input className="input w-[260px]" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} />
        <select className="select" value={domain} onChange={e=>setDomain(e.target.value)}>
          <option>All Domains</option>
          {domains.map(d=> <option key={d}>{d}</option>)}
        </select>
        <div className="ml-auto flex gap-1">
          <button className={`btn ${view==="grid"?"btn-primary":"btn-ghost"}`} onClick={()=>setView("grid")}>Grid</button>
          <button className={`btn ${view==="heat"?"btn-primary":"btn-ghost"}`} onClick={()=>setView("heat")}>Heatmap</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {([
          ["Opportunity","opportunity"],
          ["Maturity","maturity"],
          ["Tech Fit","techFit"],
          ["Strategic","strategicAlignment"],
          ["People","peopleReadiness"],
        ] as const).map(([label,key])=> (
          <div key={key}>
            <div className="text-xs text-slate-600 mb-1">{label}</div>
            <input type="range" min={0} max={100} step={5}
              value={Math.round((weights as any)[key]*100)}
              onChange={e=>{
                const pct = Number(e.target.value)/100;
                setWeights({ ...weights, [key]: pct } as Weights);
              }}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
