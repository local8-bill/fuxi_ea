"use client";
import React from "react";
import { useCapabilities } from "@/features/capabilities/Provider";
import { L2Card } from "./L2Card";

export function L1Grid() {
  const { roots, byId, children, compositeFor, weights, setOpenId, domain, sortBy } = useCapabilities();
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  const l1s = React.useMemo(() => {
    let ids = [...roots];
    const activeDomain = domain && domain !== "All Domains" ? domain : null;
    if (activeDomain) ids = ids.filter(id => (byId[id].domain ?? "Unassigned") === activeDomain);
    ids.sort((a,b) => {
      if (sortBy === "score") return compositeFor(b, weights) - compositeFor(a, weights);
      if (sortBy === "domain") return (byId[a].domain ?? "").localeCompare(byId[b].domain ?? "");
      return byId[a].name.localeCompare(byId[b].name);
    });
    return ids;
  }, [roots, byId, compositeFor, weights, domain, sortBy]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {l1s.map((id) => {
        const node = byId[id];
        const l2s = children[id] ?? [];
        const score = compositeFor(id, weights);
        const pct = score > 1 ? Math.round(score) : Math.round(score * 100);
        const isOpen = !!open[id];

        return (
          <div key={id} className="card">
            <div className="flex items-center justify-between mb-2">
              <button className="font-semibold hover:underline text-left" onClick={() => setOpenId(id)}>
                {node.name}
              </button>
              <div className="flex items-center gap-2">
                <span className="badge">{pct}/100</span>
                {l2s.length > 0 && (
                  <button className="btn" onClick={() => setOpen(prev => ({ ...prev, [id]: !prev[id] }))}>
                    {isOpen ? "−" : "+"}
                  </button>
                )}
              </div>
            </div>
            {isOpen && l2s.length > 0 && (
              <div className="space-y-3">
                {l2s.map(l2 => <L2Card key={l2} id={l2} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
