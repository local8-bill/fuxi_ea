"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";
import { DEFAULT_SCORES, compositeScore } from "@/features/capabilities/utils";

export function HeatmapView() {
  const { roots, byId, children, setOpenId, weights } = useCapabilities();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roots.map(l1 => (
        <div key={l1} className="card">
          <div className="font-semibold mb-2">{byId[l1].name}</div>
          <div className="grid grid-cols-1 gap-2">
            {(children[l1] ?? []).map(l2 => (
              <button key={l2} className="text-left rounded-md border p-3 hover:bg-slate-50"
                onClick={()=>setOpenId(l2)}>
                <div className="flex items-center justify-between">
                  <div className="text-sm">{byId[l2].name}</div>
                  <span className="badge">
                    {Math.round(compositeScore(byId[l2].scores ?? DEFAULT_SCORES, weights)*100)} / 100
                  </span>
                </div>
                {(children[l2] ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(children[l2] ?? []).map(l3 => (
                      <span key={l3} className="badge cursor-pointer" onClick={(e)=>{e.stopPropagation(); setOpenId(l3);}}>
                        {byId[l3].name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
