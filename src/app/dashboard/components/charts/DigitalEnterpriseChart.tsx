"use client";

import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type DigitalEnterpriseChartProps = {
  data: { name: string; integrations: number; criticality: number }[];
};

const COLORS = ["#2563eb", "#475569", "#0ea5e9", "#1e293b", "#334155", "#64748b"];

export function DigitalEnterpriseChart({ data }: DigitalEnterpriseChartProps) {
  const chartData = data.map((item, idx) => ({
    name: item.name,
    value: item.integrations,
    fill: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr] items-center">
      <div className="w-full" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height={280}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="95%"
            barSize={12}
            data={chartData}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={6}
              label={{ position: "insideStart", fill: "#111827", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-3 text-sm text-slate-800">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.fill }}
              aria-hidden
            />
            <span className="font-medium">{item.name}</span>
            <span className="text-slate-500 text-xs">({item.value} links)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
