"use client";

"use client";

import { useEffect, useState } from "react";
import { emitTelemetry } from "./telemetry";

type ROISummary = {
  netROI: number | null;
  breakEvenMonth: number | null;
  totalCost: number;
  totalBenefit: number;
};

type GraphStats = { nodes: number; edges: number; domains: number };

export function InsightPanel({ projectId }: { projectId?: string }) {
  const [roi, setRoi] = useState<ROISummary | null>(null);
  const [graph, setGraph] = useState<GraphStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/roi/forecast", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setRoi({
            netROI: json?.predictions?.netROI ?? null,
            breakEvenMonth: json?.predictions?.breakEvenMonth ?? null,
            totalCost: json?.predictions?.totalCost ?? 0,
            totalBenefit: json?.predictions?.totalBenefit ?? 0,
          });
        }
      } catch {
        setRoi(null);
      }
      try {
        const res = await fetch(`/api/digital-enterprise/stats${projectId ? `?project=${projectId}` : ""}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          setGraph({ nodes: json?.nodes ?? 0, edges: json?.edges ?? 0, domains: json?.domains ?? 0 });
        }
      } catch {
        setGraph(null);
      }
    };
    void load();
  }, [projectId]);

  const handleView = (title: string) => {
    void emitTelemetry("insight_card_viewed", { title, projectId });
  };

  return (
    <div className="space-y-3">
      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Insights</p>

      <div
        className="uxshell-card rounded-xl bg-white p-3 cursor-pointer hover:border-slate-300 transition"
        onClick={() => handleView("ROI summary")}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">ROI summary</p>
          <span className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-500">ROI</span>
        </div>
        {roi ? (
          <div className="mt-1 text-sm text-slate-700">
            <p>
              Net ROI:{" "}
              <span className={roi.netROI != null && roi.netROI > 1 ? "text-emerald-600" : "text-amber-600"}>
                {roi.netROI != null ? `${Math.round(roi.netROI * 100)}%` : "n/a"}
              </span>
            </p>
            <p>Break-even: {roi.breakEvenMonth != null ? `Month ${roi.breakEvenMonth}` : "n/a"}</p>
            <p>
              Totals: ${roi.totalCost.toLocaleString()} → ${roi.totalBenefit.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 mt-1">Loading ROI…</p>
        )}
      </div>

      <div
        className="uxshell-card rounded-xl bg-white p-3 cursor-pointer hover:border-slate-300 transition"
        onClick={() => handleView("Graph stats")}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Graph stats</p>
          <span className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-500">Graph</span>
        </div>
        {graph ? (
          <div className="mt-1 text-sm text-slate-700">
            <p>{graph.nodes} nodes · {graph.edges} edges</p>
            <p>{graph.domains} domains</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 mt-1">Loading graph…</p>
        )}
      </div>
    </div>
  );
}
