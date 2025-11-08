"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/Provider";
import { colorBand } from "@/lib/scoring";

export function L1Heatmap() {
  const { roots, byId, children, setOpenId, compositeFor, weights } = useCapabilities();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roots.map((l1) => (
        <div key={l1} className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{byId[l1].name}</div>
            <button className="btn" onClick={() => setOpenId(l1)}>Score</button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {(children[l1] ?? []).map((l2) => {
              const s = compositeFor(l2, weights); // 0..100
              return (
                <div key={l2} className={`rounded-md border px-3 py-2 ${colorBand(s)}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{byId[l2].name}</div>
                    <span className="badge">{Math.round(s)}/100</span>
                  </div>

                  {(children[l2] ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(children[l2] ?? []).map((l3) => (
                        <span key={l3} className="badge">
                          {byId[l3].name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

