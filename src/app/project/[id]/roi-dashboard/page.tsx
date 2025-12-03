"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import { ROIChart } from "@/components/ROIChart";

interface DomainROIData {
  domain: string;
  months: number[];
  cost: number[];
  benefit: number[];
  roi: number[];
  breakEvenMonth: number | null;
}

interface ROIForecast {
  timeline: { month: number; cost: number; benefit: number; roi: number }[];
  domains: DomainROIData[];
  predictions: { breakEvenMonth: number | null };
}

export default function ROIDashboardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "unknown";

  const [forecast, setForecast] = useState<ROIForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/roi/forecast", { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`ROI forecast failed ${res.status}: ${text}`);
        }
        const json = (await res.json()) as ROIForecast;
        setForecast(json);
        try {
          await fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_type: "roi_dashboard_opened",
              workspace_id: "roi_dashboard",
              context: { projectId },
            }),
          });
        } catch {
          // ignore telemetry failures on client
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load ROI forecast");
        setForecast(null);
      } finally {
        setLoading(false);
      }
    }

    void loadForecast();
  }, [projectId]);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="ROI DASHBOARD"
        title="ROI Forecast (Hypothesis Mode)"
        description="Mocked ROI forecast by domain using harmonized domain mapping."
      />

      {loading && (
        <Card className="mt-4">
          <p className="text-sm text-slate-600">Loading ROI forecast…</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="mt-4 border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}

      {forecast && (
        <div className="space-y-6 mt-4">
          <Card>
            <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
              <ROIChart
                data={forecast.timeline.map((p) => ({ month: p.month, cost: p.cost, benefit: p.benefit })) as any}
                breakEvenMonth={forecast.predictions.breakEvenMonth}
                currentMonth={0}
              />
              <div className="space-y-2 text-sm text-slate-700">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Break-even</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {forecast.predictions.breakEvenMonth != null
                    ? `Month ${forecast.predictions.breakEvenMonth}`
                    : "Not reached"}
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Domains</p>
                <p className="text-slate-800">{forecast.domains.length} domains included</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {forecast.domains.map((d) => (
              <Card key={d.domain} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[0.75rem] font-semibold text-slate-800">{d.domain}</p>
                  <span className="text-[0.7rem] text-slate-500">
                    Break-even: {d.breakEvenMonth != null ? `M${d.breakEvenMonth}` : "—"}
                  </span>
                </div>
                <ROIChart
                  data={d.months.map((m, idx) => ({ month: m, cost: d.cost[idx], benefit: d.benefit[idx] })) as any}
                  breakEvenMonth={d.breakEvenMonth}
                  currentMonth={0}
                />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
