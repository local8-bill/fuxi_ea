"use client";

import React from "react";

type Props = {
  domainFilter: string;
  sortKey: "name" | "score";
  summary: {
    artifacts: number;
    inventoryRows: number;
    normalizedApps: number;
  };
};

const cardClasses = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";

export function ProjectHeaderSummary({ domainFilter, sortKey, summary }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className={cardClasses}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Workspace</p>
            <p className="text-lg font-semibold text-slate-900">Modernization</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Summary</span>
        </div>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Uploaded Artifacts: {summary.artifacts}</p>
          <p className="font-medium text-slate-900">Inventory Rows: {summary.inventoryRows}</p>
          <p className="font-medium text-slate-900">Normalized Apps: {summary.normalizedApps}</p>
        </div>
      </article>
      <article className={cardClasses}>
        <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Domain Filter</p>
        <p className="mt-2 text-sm text-slate-700">Active selection: {domainFilter}</p>
      </article>
      <article className={cardClasses}>
        <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Sort</p>
        <p className="mt-2 text-sm text-slate-700">Using {sortKey} order</p>
      </article>
    </div>
  );
}
