"use client";

import React, { useMemo } from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";

export function GridView() {
  const { data, compositeFor, setOpenId, query, domain } = useCapabilities();

  // L2 rows filtered by TopBar state (query + domain)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((c) => (c.level ?? "L2") === "L2")
      .filter((c) => (domain === "All Domains" ? true : c.domain === domain))
      .filter((c) =>
        !q ? true : [c.name, c.domain].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
  }, [data, query, domain]);

  const heat = (v: number) => {
    const pct = Math.round(v * 100);
    if (pct >= 80) return "border-green-400 bg-green-50";
    if (pct >= 60) return "border-lime-400 bg-lime-50";
    if (pct >= 40) return "border-yellow-400 bg-yellow-50";
    if (pct >= 20) return "border-orange-400 bg-orange-50";
    return "border-red-400 bg-red-50";
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((c) => {
        const comp = compositeFor(c); // 0..1
        return (
          <button
            key={c.id}
            onClick={() => setOpenId(c.id)}
            className={`rounded-xl border p-4 text-left transition hover:shadow-md bg-white ${heat(comp)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium leading-snug">{c.name}</div>
              <div className="shrink-0 text-xs text-gray-600">{Math.round(comp * 100)}/100</div>
            </div>
            {c.domain && (
              <div className="mt-1 text-[11px] text-gray-500">{c.domain}</div>
            )}
            <p className="mt-2 text-xs text-gray-500">Tap to open scoring</p>
          </button>
        );
      })}
    </div>
  );
}

export default GridView;