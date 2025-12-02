"use client";

import React from "react";

type Props = {
  variant: "scoring" | "techStack";
  summary: {
    artifacts: number;
    inventoryRows: number;
    normalizedApps: number;
  };
  domainFilter?: string;
  sortKey?: "name" | "score";
};

const cardClasses = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";

export function ProjectHeaderSummary({ variant, summary, domainFilter, sortKey }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className={cardClasses}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Workspace</p>
            <p className="text-lg font-semibold text-slate-900">Tech Stack Workspace</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Status</span>
        </div>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-900">App artifacts: {summary.artifacts}</p>
          <p className="font-medium text-slate-900">Inventory rows: {summary.inventoryRows}</p>
          <p className="font-medium text-slate-900">Normalized apps: {summary.normalizedApps}</p>
        </div>
      </article>
      <article className={cardClasses}>
        <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
          {variant === "scoring" ? "Capability Filter" : "Domain Filter"}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Domain: {variant === "scoring" ? domainFilter ?? "All Domains" : "All Domains"}
        </p>
        {variant === "scoring" && (
          <p className="text-xs text-slate-500">Levels: L1–L3</p>
        )}
      </article>
      <article className={cardClasses}>
        <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
          {variant === "scoring" ? "Scoring Settings" : "Tech Stack Settings"}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Sort: {variant === "scoring" ? sortKey ?? "name" : "name"} order
        </p>
        {variant === "scoring" ? (
          <p className="text-xs text-slate-500">View: Capabilities</p>
        ) : (
          <p className="text-xs text-slate-500">View: Tech Stack</p>
        )}
      </article>
    </div>
  );
}
