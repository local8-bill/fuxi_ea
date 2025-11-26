"use client";

import React from "react";
import type { DirectiveMeta } from "@/lib/verification/data";

const statusColor: Record<NonNullable<DirectiveMeta["status"]>, string> = {
  complete: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  in_progress: "bg-amber-100 text-amber-700 border border-amber-200",
  at_risk: "bg-rose-100 text-rose-700 border border-rose-200",
  unknown: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function DirectiveTable({ items }: { items: DirectiveMeta[] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-500">No directives found in docs/features.</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">ID</th>
            <th className="px-4 py-2 text-left font-semibold">Title</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 text-left font-semibold">File</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.file} className="border-t border-slate-100">
              <td className="px-4 py-2 font-semibold text-slate-900">{d.id}</td>
              <td className="px-4 py-2 text-slate-800">{d.title}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusColor[d.status ?? "unknown"]}`}>
                  {d.status ?? "unknown"}
                </span>
              </td>
              <td className="px-4 py-2 text-xs text-slate-600">{d.file}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
