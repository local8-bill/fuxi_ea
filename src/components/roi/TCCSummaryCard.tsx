"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

type Classification = "Lean" | "Moderate" | "Complex";

interface TCCBreakdown {
  project: number;
  transition: number;
  operational: number;
  human: number;
  risk: number;
  total: number;
  ratio: number;
  classification: Classification;
}

interface ForecastResponse {
  predictions: {
    tccTotal: number;
    tccRatio: number;
    tccClassification: Classification;
    tccBreakdown: TCCBreakdown;
  };
}

const bandColor: Record<Classification, string> = {
  Lean: "text-emerald-600",
  Moderate: "text-amber-600",
  Complex: "text-rose-600",
};

const barTone: Record<keyof TCCBreakdown, string> = {
  project: "bg-slate-200",
  transition: "bg-blue-200",
  operational: "bg-amber-200",
  human: "bg-emerald-200",
  risk: "bg-rose-200",
  total: "bg-slate-200",
  ratio: "bg-slate-200",
  classification: "bg-slate-200",
};

function formatUsd(value: number) {
  return `$${value.toLocaleString()}`;
}

export function TCCSummaryCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ForecastResponse["predictions"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError(null);
      try {
        const res = await fetch(`/api/roi/forecast?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ForecastResponse;
        if (!mounted) return;
        setData(json.predictions);
        void fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "tcc_visualized",
            workspace_id: "roi_dashboard",
            context: { projectId, tccRatio: json.predictions.tccRatio },
          }),
        }).catch(() => {});
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Failed to load TCC");
        setData(null);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const segments = useMemo(() => {
    if (!data || !data.tccBreakdown) return [];
    const base = data.tccBreakdown.project;
    const denom = base === 0 ? 1 : base;
    return [
      { key: "project", label: "Project", value: base, pct: base / denom },
      { key: "transition", label: "Transition", value: data.tccBreakdown.transition, pct: data.tccBreakdown.transition / denom },
      { key: "operational", label: "Operational", value: data.tccBreakdown.operational, pct: data.tccBreakdown.operational / denom },
      { key: "human", label: "Human", value: data.tccBreakdown.human, pct: data.tccBreakdown.human / denom },
      { key: "risk", label: "Risk", value: data.tccBreakdown.risk, pct: data.tccBreakdown.risk / denom },
    ];
  }, [data]);

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Total Cost of Change</h2>
        <span className={`text-sm font-semibold ${data ? bandColor[data.tccClassification] : "text-slate-500"}`}>
          {data ? data.tccClassification : "—"}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            TCC Ratio: <span className="font-semibold text-slate-900">{Math.round(data.tccRatio * 100)}%</span>
          </p>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {segments.map((seg) => (
              <div
                key={seg.key}
                className={`${barTone[seg.key as keyof TCCBreakdown]} h-full`}
                style={{ width: `${Math.max(2, seg.pct * 100)}%` }}
                title={`${seg.label}: ${formatUsd(seg.value)}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <p>Project:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccBreakdown.project)}</p>
            </div>
            <div>
              <p>Transition:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccBreakdown.transition)}</p>
            </div>
            <div>
              <p>Operational:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccBreakdown.operational)}</p>
            </div>
            <div>
              <p>Human:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccBreakdown.human)}</p>
            </div>
            <div>
              <p>Risk:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccBreakdown.risk)}</p>
            </div>
            <div>
              <p>Total TCC:</p>
              <p className="font-semibold text-slate-900">{formatUsd(data.tccTotal)}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
