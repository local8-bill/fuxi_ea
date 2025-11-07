"use client";

import React, { useMemo } from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";

export function HeatmapView() {
  const { data, compositeFor, setOpenId, query, domain } = useCapabilities();

  // L2s filtered by query/domain
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((c) => (c.level ?? "L2") === "L2")
      .filter((c) => (domain === "All Domains" ? true : c.domain === domain))
      .filter((c) =>
        !q ? true : [c.name, c.domain].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
  }, [data, query, domain]);

  // group by domain
  const byDomain = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const c of rows) {
      const d = c.domain || "—";
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(c);
    }
    return m;
  }, [rows]);

  const heat = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct >= 80) return "border-green-400 bg-green-50";
    if (pct >= 60) return "border-lime-400 bg-lime-50";
    if (pct >= 40) return "border-yellow-400 bg-yellow-50";
    if (pct >= 20) return "border-orange-400 bg-orange-50";
    return "border-red-400 bg-red-50";
  };

  return (
    <div className="space-y-6">
      {[...byDomain.entries()].map(([dom, caps]) => (
        <div key={dom}>
          <div className="mb-2 text-sm font-semibold">{dom}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {caps.map((c) => {
              const comp = compositeFor(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-xs hover:opacity-90 bg-white ${heat(comp)}`}
                >
                  <div className="line-clamp-2 font-medium">{c.name}</div>
                  <div className="mt-1 text-[10px] text-gray-600">
                    {Math.round(comp * 100)}/100
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HeatmapView;