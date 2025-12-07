"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type AnticipationViewStat = {
  view: string;
  anticipations: number;
  accepted: number;
  dismissed: number;
  acceptanceRate: number;
  avgTimeToActionMs: number | null;
};

type AnticipationResponse = {
  ok: boolean;
  totals: {
    anticipations: number;
    accepted: number;
    dismissed: number;
    acceptanceRate: number;
    avgTimeToActionMs: number | null;
  };
  byView: AnticipationViewStat[];
  error?: string;
};

const viewLabels: Record<string, string> = {
  graph: "Digital Enterprise",
  roi: "ROI Dashboard",
  sequencer: "Sequencer",
  review: "Review",
  unknown: "Unknown",
};

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—";
  const seconds = ms / 1000;
  if (seconds < 1) return `${seconds.toFixed(1)}s`;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  return `${Math.round(seconds)}s`;
}

export function AnticipationTelemetryCard({ projectId }: { projectId: string }) {
  const [stats, setStats] = useState<AnticipationResponse["totals"] | null>(null);
  const [byView, setByView] = useState<AnticipationViewStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/telemetry/anticipation", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load telemetry (${res.status})`);
        const json = (await res.json()) as AnticipationResponse;
        if (!mounted) return;
        if (!json.ok) throw new Error(json.error || "Telemetry unavailable");
        const sortedViews = [...(json.byView ?? [])].sort((a, b) => b.anticipations - a.anticipations);
        setStats(json.totals);
        setByView(sortedViews);
        void fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "anticipation_metrics_viewed",
            workspace_id: "roi_dashboard",
            data: {
              projectId,
              acceptanceRate: json.totals.acceptanceRate,
              anticipations: json.totals.anticipations,
            },
          }),
        }).catch(() => {});
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? "Unable to load telemetry");
        setStats(null);
        setByView([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Anticipation Signals</p>
          <p className="text-base font-semibold text-slate-900">Agent Performance Telemetry</p>
        </div>
        <span className="text-sm text-slate-500">
          {stats ? `${Math.round(stats.acceptanceRate * 100)}% acceptance` : "—"}
        </span>
      </div>

      {loading && <p className="mt-3 text-sm text-slate-600">Loading telemetry…</p>}
      {error && !loading && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {stats && !loading && !error && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Triggers</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.anticipations}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-emerald-600">Accepted</p>
              <p className="text-2xl font-semibold text-emerald-700">{stats.accepted}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Avg. time to act</p>
              <p className="text-2xl font-semibold text-slate-900">{formatDuration(stats.avgTimeToActionMs)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Focus areas</p>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
              {byView.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No anticipatory data recorded yet.</p>}
              {byView.map((bucket) => (
                <div key={bucket.view} className="flex items-center justify-between px-3 py-2 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{viewLabels[bucket.view] ?? bucket.view}</p>
                    <p className="text-xs text-slate-500">
                      {bucket.anticipations} triggers · {bucket.accepted} accepted
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{Math.round(bucket.acceptanceRate * 100)}%</p>
                    <p className="text-xs text-slate-500">{formatDuration(bucket.avgTimeToActionMs)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
