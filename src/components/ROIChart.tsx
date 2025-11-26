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
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ minHeight: 260 }}>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
        ROI Forecast (Cost vs Benefit)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.04)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          {breakEvenMonth != null && (
            <ReferenceLine x={breakEvenMonth} stroke="#0ea5e9" strokeDasharray="4 4" label="Break-even" />
          )}
          <ReferenceLine x={currentMonth} stroke="#9333ea" strokeDasharray="2 2" label="Now" />
          <Line type="monotone" dataKey="cost" stroke="#f87171" strokeWidth={2} dot={false} name="Cost" />
          <Line type="monotone" dataKey="benefit" stroke="#22c55e" strokeWidth={2} dot={false} name="Benefit" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
