"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { ROIChart } from "@/components/ROIChart";
import { ROISummaryCard } from "@/components/roi/ROISummaryCard";
import { TCCSummaryCard } from "@/components/roi/TCCSummaryCard";
import { AnticipationTelemetryCard } from "@/components/roi/AnticipationTelemetryCard";

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
  predictions: {
    breakEvenMonth: number | null;
    netROI: number | null;
    totalCost: number;
    totalBenefit: number;
    tccTotal: number;
    tccRatio: number;
    tccClassification: "Lean" | "Moderate" | "Complex";
  };
}

export function ROIScene({ projectId }: { projectId: string }) {
  const [forecast, setForecast] = useState<ROIForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/roi/forecast?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        const json = (await res.json()) as ROIForecast;
        if (!cancelled) setForecast(json);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load ROI forecast");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading ROI forecast…</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!forecast) {
    return <p className="text-sm text-slate-500">No forecast available.</p>;
  }

  return (
    <div className="space-y-4">
      <WorkspaceHeader
        statusLabel="ROI"
        title="ROI Forecast"
        description="Mocked ROI forecast by domain using harmonized mapping."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <ROISummaryCard projectId={projectId} />
        <TCCSummaryCard projectId={projectId} />
      </div>
      <Card className="p-4">
        <ROIChart
          data={forecast.timeline}
          breakEvenMonth={forecast.predictions.breakEvenMonth}
          currentMonth={forecast.timeline[forecast.timeline.length - 1]?.month ?? 0}
        />
      </Card>
      <Card className="p-4">
        <AnticipationTelemetryCard projectId={projectId} />
      </Card>
    </div>
  );
}
