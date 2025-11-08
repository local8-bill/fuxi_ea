"use client";

import React, { useState } from "react";
import type { Weights } from "./utils";

export function TopBar({
  query, setQuery,
  domain, setDomain,
  view, setView,
  weights, setWeights,
  domains,
  onExport,
}: {
  query: string; setQuery: (v: string) => void;
  domain: string; setDomain: (v: string) => void;
  view: "grid" | "heat"; setView: (v: "grid" | "heat") => void;
  weights: Weights; setWeights: (w: Weights) => void;
  domains: string[];
  onExport: () => void;
}) {
  const [showWeights, setShowWeights] = useState(false);

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", borderBottom: "1px solid #eee" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>Fuxi • Capability Scoring</div>

        <input
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          placeholder="Search capabilities…"
          style={{ marginLeft: 12, flex: "0 0 260px", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}
        />

        <select
          value={domain}
          onChange={(e)=>setDomain(e.target.value)}
          style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}
        >
          <option value="All Domains">All Domains</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <div style={{ display: "inline-flex", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <button
              onClick={()=>setView("grid")}
              style={{ padding: "6px 10px", background: view==="grid" ? "#f4f4f5" : "#fff", borderRight: "1px solid #ddd" }}
            >Grid</button>
            <button
              onClick={()=>setView("heat")}
              style={{ padding: "6px 10px", background: view==="heat" ? "#f4f4f5" : "#fff" }}
            >Heatmap</button>
          </div>

          <button
            onClick={()=>setShowWeights(!showWeights)}
            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
            Weights
          </button>

          <button
            onClick={onExport}
            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {showWeights && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", borderTop: "1px solid #eee", background: "#fafafa" }}>
          {([
            ["Opportunity", "opportunity"],
            ["Maturity", "maturity"],
            ["Tech Fit", "techFit"],
            ["Strategic Alignment", "strategicAlignment"],
            ["People Readiness", "peopleReadiness"],
          ] as const).map(([label, key]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr 48px", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ color: "#555", fontSize: 12 }}>{label}</div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((weights as any)[key] * 100)}
                onChange={(e)=>{
                  const pct = Number(e.target.value)/100;
                  setWeights({ ...weights, [key]: pct });
                }}
              />
              <div style={{ textAlign: "right", fontSize: 12 }}>{Math.round((weights as any)[key]*100)}%</div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "#777" }}>Weights are applied as-is (no strict 100% requirement).</div>
        </div>
      )}
    </div>
  );
}