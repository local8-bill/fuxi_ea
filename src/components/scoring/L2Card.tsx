"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/Provider";

export function L2Card({ id }: { id: string }) {
  const { byId, children, compositeFor, weights, setOpenId } = useCapabilities();
  const node = byId[id];
  const l3s = children[id] ?? [];
  const score = compositeFor(id, weights);
  const pct = score > 1 ? Math.round(score) : Math.round(score * 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <button className="font-medium text-left hover:underline" onClick={() => setOpenId(id)}>
          {node.name}
        </button>
        <span className="badge">{pct}/100</span>
      </div>
      {l3s.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {l3s.map(l3 => (
            <button key={l3} className="badge hover:bg-slate-100" onClick={() => setOpenId(l3)}>
              {byId[l3].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
