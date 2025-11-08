"use client";

import { useMemo } from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";

export function GridView() {
  const { byId, children, filteredIds, compositeFor, setOpenId, isOverridden } = useCapabilities();

  const l2Rows = useMemo(
    () => filteredIds.map((id) => byId[id]).filter((n) => n.level === "L2"),
    [filteredIds, byId]
  );

  const l1Groups = useMemo(() => {
    const groups: Record<string, { id: string; items: string[] }> = {};
    for (const id of filteredIds) {
      const n = byId[id];
      if (n.level !== "L2") continue;
      const p = n.parentId ?? "_orphan";
      (groups[p] ||= { id: p, items: [] }).items.push(id);
    }
    return Object.values(groups);
  }, [filteredIds, byId]);

  return (
    <div className="grid gap-4">
      {l1Groups.map((g) => {
        const parent = byId[g.id];
        return (
          <div key={g.id} className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="text-sm font-semibold">{parent?.name ?? "Ungrouped"}</div>
              <div className="text-xs text-gray-500">
                Score: {parent ? compositeFor(parent.id).toFixed(2) : "-"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((id) => {
                const n = byId[id];
                const score = compositeFor(id).toFixed(2);
                const overridden = isOverridden(id);
                const childCount = (children[id] || []).length;
                return (
                  <button
                    key={id}
                    onClick={() => setOpenId(id)}
                    className="flex flex-col items-start rounded-lg border p-3 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="font-medium">{n.name}</div>
                      <div className="text-xs text-gray-600">{score}</div>
                    </div>
                    <div className="mt-1 flex w-full items-center justify-between text-xs text-gray-500">
                      <div>{childCount ? `${childCount} L3` : "Leaf"}</div>
                      {overridden && <div className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white">Override</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {l2Rows.length === 0 and (
        <div className="rounded-xl border border-dashed p-6 text-center text-gray-600">
          Nothing matches your filters.
        </div>
      )}
    </div>
  );
}
