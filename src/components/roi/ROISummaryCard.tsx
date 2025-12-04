"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface ForecastPredictions {
  breakEvenMonth: number | null;
  netROI: number | null;
  totalCost: number;
  totalBenefit: number;
  tccTotal?: number;
  tccRatio?: number;
  tccClassification?: "Lean" | "Moderate" | "Complex";
}

interface ForecastResponse {
  predictions: ForecastPredictions;
}

type StatusTone = "positive" | "neutral" | "negative";

function toneForRoi(roi: number | null): StatusTone {
  if (roi == null) return "neutral";
  if (roi > 1) return "positive";
  if (roi < 1) return "negative";
  return "neutral";
}

export function ROISummaryCard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ForecastPredictions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/roi/forecast?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `ROI summary load failed ${res.status}`);
        }
        const json = (await res.json()) as ForecastResponse;
        if (!mounted) return;
        setData(json.predictions);
        // fire telemetry (best-effort)
        void fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "roi_summary_displayed",
            workspace_id: "roi_dashboard",
            context: {
              projectId,
              netROI: json.predictions?.netROI ?? null,
              breakEvenMonth: json.predictions?.breakEvenMonth ?? null,
              totalCost: json.predictions?.totalCost ?? null,
              totalBenefit: json.predictions?.totalBenefit ?? null,
            },
          }),
        }).catch(() => {});
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Failed to load ROI summary");
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const tone = toneForRoi(data?.netROI ?? null);
  const color =
    tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-rose-600" : "text-amber-600";

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900">ROI Summary</h2>
        <Link href="/docs/math_explainers.md" className="text-sm text-slate-500 hover:underline" target="_blank">
          ?
        </Link>
      </div>
      {loading && <p className="mt-2 text-sm text-slate-600">Loading summary…</p>}
      {error && !loading && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {data && !loading && !error && (
        <div className="mt-3 space-y-1">
          <p className={`text-2xl font-bold ${color}`}>
            {data.netROI != null ? `${Math.round(data.netROI * 100)}%` : "n/a"}
          </p>
          <p className="text-sm text-slate-600">
            Break-even: {data.breakEvenMonth != null ? `Month ${data.breakEvenMonth}` : "Not reached"}
          </p>
          <p className="text-sm text-slate-600">
            Total Cost: ${data.totalCost.toLocaleString()} · Total Benefit: ${data.totalBenefit.toLocaleString()}
          </p>
        </div>
      )}
    </Card>
  );
}
