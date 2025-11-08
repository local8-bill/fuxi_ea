"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";
import type { Scores } from "@/features/capabilities/utils";

export function ScoringPanel({ onClose }:{ onClose:()=>void }) {
  const { openId, setOpenId, byId, updateScore } = useCapabilities();
  const cap = openId ? byId[openId] : null;
  if (!cap) return null;

  const setVal = (key:keyof Scores, v:number)=> updateScore(cap.id, key, v);

  return (
    <div className="sheet">
      <div className="sheet-header flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{cap.name}</div>
          {cap.domain && <div className="text-xs text-slate-600">{cap.domain}</div>}
        </div>
        <button className="btn btn-ghost" onClick={()=>{ setOpenId(null); onClose(); }}>Close</button>
      </div>
      <div className="sheet-body space-y-4">
        {([
          ["Opportunity","opportunity"],
          ["Maturity","maturity"],
          ["Tech Fit","techFit"],
          ["Strategic Alignment","strategicAlignment"],
          ["People Readiness","peopleReadiness"],
        ] as const).map(([label,key])=> (
          <div key={key}>
            <div className="flex items-center justify-between">
              <div className="text-sm">{label}</div>
            </div>
            <input type="range" min={1} max={5} step={1}
              defaultValue={(cap.scores?.[key] ?? 3)}
              onChange={e=> setVal(key, Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
