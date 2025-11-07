"use client";

import React, { useState } from "react";
// IMPORTANT: project-scoped import
import { useCapabilities } from "@/features/capabilities/AdhocProjectScoringProvider"; 
import type { Weights } from "@/features/capabilities/utils";

export function TopBar({
  view,
  setView,
}: {
  view: "grid" | "heat";
  setView: (v: "grid" | "heat") => void;
}) {
  const {
    query, setQuery,
    domain, setDomain,
    domains,
    weights, setWeights,
    exportJson,
    resetAllScores,
  } = useCapabilities();

  const [showWeights, setShowWeights] = useState(false);

  const handleReset = () => {
    if (confirm("Reset all scores to defaults?")) resetAllScores();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-4">
        <div className="text-base font-semibold">Fuxi • Capability Scoring</div>

        <div className="flex w-full items-center gap-2 sm:max-w-xs sm:ml-3">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search capabilities…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-2">
          <select
            value={domain}
            onChange={(e)=>setDomain(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          >
            {domains.map((d)=>(<option key={d} value={d}>{d}</option>))}
          </select>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="inline-flex overflow-hidden rounded-md border">
            <button
              onClick={()=>setView("grid")}
              className={`px-3 py-2 text-sm ${view==="grid" ? "bg-gray-100" : "bg-white"} border-r`}
            >Grid</button>
            <button
              onClick={()=>setView("heat")}
              className={`px-3 py-2 text-sm ${view==="heat" ? "bg-gray-100" : "bg-white"}`}
            >Heatmap</button>
          </div>

          <button
            onClick={()=>setShowWeights(!showWeights)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Weights
          </button>

          <button
            onClick={exportJson}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Export
          </button>

          <button
            onClick={handleReset}
            className="rounded-md border border-yellow-300 bg-white px-3 py-2 text-sm text-yellow-800 hover:bg-yellow-50"
          >
            Reset
          </button>
        </div>
      </div>

      {showWeights && (
        <div className="border-t bg-gray-50">
          <div className="mx-auto grid max-w-[1100px] gap-3 p-4 sm:grid-cols-2">
            {([
              ["Opportunity", "opportunity"],
              ["Maturity", "maturity"],
              ["Tech Fit", "techFit"],
              ["Strategic Alignment", "strategicAlignment"],
              ["People Readiness", "peopleReadiness"],
            ] as const).map(([label, key]) => (
              <div key={key} className="grid grid-cols-[160px_1fr_48px] items-center gap-3">
                <div className="text-xs text-gray-600">{label}</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round((weights as any)[key] * 100)}
                  onChange={(e)=>{
                    const pct = Number(e.target.value)/100;
                    setWeights({ ...weights, [key]: pct } as Weights);
                  }}
                />
                <div className="text-right text-xs text-gray-700">
                  {Math.round((weights as any)[key]*100)}%
                </div>
              </div>
            ))}
            <div className="col-span-full text-xs text-gray-500">
              Weights are applied as-is (no strict 100% requirement).
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopBar;