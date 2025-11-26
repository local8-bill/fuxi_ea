"use client";

import React from "react";
import type { HealthSummary } from "@/lib/verification/data";

export function HealthMeter({ summary }: { summary: HealthSummary }) {
  const buildColor =
    summary.buildStatus === "pass"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : summary.buildStatus === "fail"
        ? "bg-rose-100 text-rose-700 border border-rose-200"
        : "bg-slate-100 text-slate-600 border border-slate-200";

  const cards = [
    { label: "Directives", value: summary.directiveCount },
    { label: "Completed", value: summary.completedCount },
    { label: "Tests Passing", value: `${summary.testsPassing}/${summary.testsTotal || "—"}` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div className={`rounded-xl px-3 py-3 text-sm font-semibold ${buildColor}`}>Build: {summary.buildStatus}</div>
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{c.label}</div>
          <div className="text-xl font-semibold text-slate-900">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
