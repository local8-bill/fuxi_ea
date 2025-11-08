"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/Provider";
import { colorBand } from "@/lib/colorBand";

export function L1Tile({ id }: { id:string }) {
  const { byId, children, compositeFor, weights, setOpenId } = useCapabilities();
  const node = byId[id];
  const score = compositeFor(id, weights);
  const pct = score > 1 ? Math.round(score) : Math.round(score * 100);
  const l2count = (children[id] ?? []).length;

  return (
    <button className={`card text-left hover:bg-slate-50 border ${colorBand(score)}`} onClick={()=>setOpenId(id)}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{node.name}</div>
        <span className="badge">{pct}/100</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
        <span className="badge">{node.domain}</span>
        <span>{l2count} sub-capabilities</span>
      </div>
    </button>
  );
}