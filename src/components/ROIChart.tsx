"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { ROICurvePoint } from "@/hooks/useROISimulation";

type ROIChartProps = {
  data: ROICurvePoint[];
  breakEvenMonth: number | null;
  currentMonth: number;
};

export function ROIChart({ data, breakEvenMonth, currentMonth }: ROIChartProps) {
  // ensure X axis uses numeric months in ascending order to avoid jitter
  const sorted = [...data].sort((a, b) => a.month - b.month);
  const maxMonth = sorted.length ? sorted[sorted.length - 1].month : 0;
  const showBreakEven = breakEvenMonth != null && breakEvenMonth > 0;
  const showNow = currentMonth != null && currentMonth > 0;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ minHeight: 260 }}>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
        ROI Forecast (Cost vs Benefit)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sorted} margin={{ top: 8, right: 12, bottom: 12, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, maxMonth]}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(v) => {
              if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
              return v;
            }}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.04)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          {showBreakEven && (
            <ReferenceLine
              x={breakEvenMonth}
              stroke="#0ea5e9"
              strokeDasharray="4 4"
              label={{ value: "Break-even", position: "top", fontSize: 11, fill: "#0ea5e9" }}
            />
          )}
          {showNow && (
            <ReferenceLine
              x={currentMonth}
              stroke="#9333ea"
              strokeDasharray="2 2"
              label={{ value: "Now", position: "top", fontSize: 11, fill: "#9333ea" }}
            />
          )}
          <Line type="monotone" dataKey="cost" stroke="#f87171" strokeWidth={2} dot={false} name="Cost" />
          <Line type="monotone" dataKey="benefit" stroke="#22c55e" strokeWidth={2} dot={false} name="Benefit" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
