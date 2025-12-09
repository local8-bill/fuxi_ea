"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ROIChart } from "@/components/ROIChart";
import { TCCSummaryCard } from "@/components/roi/TCCSummaryCard";
import { AnticipationTelemetryCard } from "@/components/roi/AnticipationTelemetryCard";
import { AdaptiveSignalsPanel } from "@/components/learning/AdaptiveSignalsPanel";
import { useLearningSnapshot } from "@/hooks/useLearningSnapshot";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ROIClassificationBreakdown } from "@/components/roi/ROIClassificationBreakdown";

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
  const { snapshot } = useLearningSnapshot(projectId);
  const telemetry = useTelemetry("roi_dashboard", { projectId });

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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load ROI forecast";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!forecast) return;
    telemetry.log("roi_forecast_viewed", {
      projectId,
      breakEvenMonth: forecast.predictions.breakEvenMonth,
      netROI: forecast.predictions.netROI,
      tccRatio: forecast.predictions.tccRatio,
    });
  }, [forecast, projectId, telemetry]);

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
      <TCCSummaryCard projectId={projectId} />
      <ROIClassificationBreakdown projectId={projectId} />
      <AdaptiveSignalsPanel snapshot={snapshot} title="ROI Signals" subtitle="Finance confidence" />
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
