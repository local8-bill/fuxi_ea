"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/Provider";
import type { Scores } from "@/lib/scoring";

const SCORE_KEYS = [
  { key: "opportunity", label: "Opportunity" },
  { key: "maturity", label: "Maturity" },
  { key: "techFit", label: "Tech Fit" },
  { key: "strategicAlignment", label: "Strategic Alignment" },
  { key: "peopleReadiness", label: "People Readiness" },
] as const;

export function ScoringDrawer({ onClose }: { onClose: () => void }) {
  const {
    openId, byId, compositeFor, weights,
    effectiveScores, updateScore, setOverrideEnabled, updateOverride
  } = useCapabilities();
  const id = openId ?? null;
  const node = id ? byId[id] : null;
  if (!id || !node) return null;

  const eff = effectiveScores(id);
  const composite = Math.round(compositeFor(id, weights));

  const handleBaseChange = (k: keyof Scores, pct: number) => {
    updateScore(id, k, pct);
  };
  const handleOverrideChange = (k: keyof Scores, pct: number) => {
    updateOverride(id, k, pct);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">{node.name}</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="badge">Composite: {composite}/100</span>
          {node.domain && <span className="badge">{node.domain}</span>}
        </div>

        <div className="card space-y-3 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!node.overrideEnabled}
              onChange={(e)=> setOverrideEnabled(id, e.target.checked)}
            />
            <span className="font-medium">Use override scores for this capability</span>
          </label>
          <p className="text-sm text-slate-600">
            When enabled, the sliders below will write to an "override" set and take precedence over the base scores.
          </p>
        </div>

        <div className="space-y-3">
          {SCORE_KEYS.map(({key,label}) => {
            const activeVal = node.overrideEnabled && node.overrideScores
              ? node.overrideScores[key]
              : (node.scores?.[key] ?? 0.5);
            const pct = Math.round((activeVal ?? 0) * 100);

            return (
              <div key={key} className="card">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{label}</div>
                  <div className="badge">{pct}/100</div>
                </div>
                <input
                  type="range" min={0} max={100} value={pct}
                  onChange={(e)=>{
                    const v = Number(e.target.value) / 100;
                    if (node.overrideEnabled) handleOverrideChange(key as keyof Scores, v);
                    else handleBaseChange(key as keyof Scores, v);
                  }}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
