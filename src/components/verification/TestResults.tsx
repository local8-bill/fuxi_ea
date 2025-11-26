"use client";

import React from "react";
import type { TestResult } from "@/lib/verification/data";

const badge = (status: TestResult["status"]) => {
  if (status === "pass") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (status === "fail") return "bg-rose-100 text-rose-700 border border-rose-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
};

export function TestResults({ results }: { results: TestResult[] }) {
  if (!results.length) {
    return <div className="text-sm text-slate-500">No test results yet. Wire to D017 outputs in /tests/results/.</div>;
  }
  return (
    <div className="space-y-2">
      {results.map((t, i) => (
        <div key={`${t.suite}-${i}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div>
            <div className="font-semibold text-slate-900">{t.suite}</div>
            {t.details && <div className="text-xs text-slate-600 mt-1">{t.details}</div>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badge(t.status)}`}>{t.status}</span>
            {t.runAt && <span className="text-[11px] text-slate-500">Run: {t.runAt}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
