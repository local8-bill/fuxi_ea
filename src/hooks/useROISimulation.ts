"use client";

import React, { useMemo, useState } from "react";
import type { SimulationEvent } from "@/types/livingMap";

export type ROICurvePoint = { month: number; cost: number; benefit: number };

export type ROISimulationResult = {
  timeline: ROICurvePoint[];
  breakEvenMonth: number | null;
  events: SimulationEvent[];
  filteredEvents: SimulationEvent[];
  month: number;
  setMonth: (m: number) => void;
  loading: boolean;
};

const MOCK_EVENTS: SimulationEvent[] = [
  {
    id: "evt-1",
    timestamp: "2025-06-01",
    month: 6,
    type: "system_decommissioned",
    title: "CRM v1 retired",
    detail: "2 downstream systems impacted, rerouting to CRM NextGen.",
    domain: "Experience",
    severity: "warning",
  },
  {
    id: "evt-2",
    timestamp: "2025-09-15",
    month: 9,
    type: "system_golive",
    title: "ERP NextGen Go-Live",
    detail: "3 integrations migrated; latency improved 12%.",
    domain: "Core Ops",
    severity: "info",
  },
  {
    id: "evt-3",
    timestamp: "2026-01-01",
    month: 12,
    type: "domain_modernized",
    title: "Data Warehouse consolidation",
    detail: "ROI threshold reached; redundancy reduced.",
    domain: "Data",
    severity: "info",
  },
];

async function fetchForecast() {
  try {
    const res = await fetch("/api/roi/forecast", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useROISimulation(totalMonths = 24): ROISimulationResult {
  const [month, setMonth] = useState(0);
  const [timeline, setTimeline] = useState<ROICurvePoint[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>(MOCK_EVENTS);
  const [predictedBreakEven, setPredictedBreakEven] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchForecast();
      if (!cancelled) {
        if (data?.timeline?.length) {
          setTimeline(data.timeline);
        } else {
          const points: ROICurvePoint[] = [];
          let cumulativeCost = 0;
          let cumulativeBenefit = 0;
          for (let m = 0; m <= totalMonths; m++) {
            const monthlyCost = m < 6 ? 200 : m < 12 ? 150 : 80;
            const monthlyBenefit = m < 6 ? 50 : m < 12 ? 120 : 220;
            cumulativeCost += monthlyCost;
            cumulativeBenefit += monthlyBenefit;
            points.push({ month: m, cost: cumulativeCost, benefit: cumulativeBenefit });
          }
          setTimeline(points);
        }

        if (data?.events?.length) {
          setEvents(data.events);
        }

        if (data?.predictions?.breakEvenMonth != null) {
          setPredictedBreakEven(data.predictions.breakEvenMonth);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalMonths]);

  const breakEvenMonth = useMemo(() => {
    const fromPrediction = predictedBreakEven;
    if (fromPrediction != null) return fromPrediction;
    const point = timeline.find((p) => p.benefit >= p.cost);
    return point?.month ?? null;
  }, [timeline, predictedBreakEven]);

  const filteredEvents = events.filter((e) => (e as any).month == null || (e as any).month <= month);

  return { timeline, breakEvenMonth, events, filteredEvents, month, setMonth, loading };
}
