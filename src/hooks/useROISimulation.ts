"use client";

import { useMemo, useState } from "react";
import type { SimulationEvent } from "@/types/livingMap";

export type ROICurvePoint = { month: number; cost: number; benefit: number };

export type ROISimulationResult = {
  timeline: ROICurvePoint[];
  breakEvenMonth: number | null;
  events: SimulationEvent[];
  month: number;
  setMonth: (m: number) => void;
};

const MOCK_EVENTS: SimulationEvent[] = [
  {
    id: "evt-1",
    timestamp: "2025-06-01",
    type: "system_decommissioned",
    title: "CRM v1 retired",
    detail: "2 downstream systems impacted, rerouting to CRM NextGen.",
    domain: "Experience",
    severity: "warning",
  },
  {
    id: "evt-2",
    timestamp: "2025-09-15",
    type: "system_golive",
    title: "ERP NextGen Go-Live",
    detail: "3 integrations migrated; latency improved 12%.",
    domain: "Core Ops",
    severity: "info",
  },
  {
    id: "evt-3",
    timestamp: "2026-01-01",
    type: "domain_modernized",
    title: "Data Warehouse consolidation",
    detail: "ROI threshold reached; redundancy reduced.",
    domain: "Data",
    severity: "info",
  },
];

export function useROISimulation(totalMonths = 24): ROISimulationResult {
  const [month, setMonth] = useState(0);

  const timeline: ROICurvePoint[] = useMemo(() => {
    const points: ROICurvePoint[] = [];
    let cumulativeCost = 0;
    let cumulativeBenefit = 0;
    for (let m = 0; m <= totalMonths; m++) {
      // Mock curves: cost front-loaded, benefit ramps up later
      const monthlyCost = m < 6 ? 200 : m < 12 ? 150 : 80;
      const monthlyBenefit = m < 6 ? 50 : m < 12 ? 120 : 220;
      cumulativeCost += monthlyCost;
      cumulativeBenefit += monthlyBenefit;
      points.push({ month: m, cost: cumulativeCost, benefit: cumulativeBenefit });
    }
    return points;
  }, [totalMonths]);

  const breakEvenMonth = useMemo(() => {
    const point = timeline.find((p) => p.benefit >= p.cost);
    return point?.month ?? null;
  }, [timeline]);

  const events = MOCK_EVENTS;

  return { timeline, breakEvenMonth, events, month, setMonth };
}
