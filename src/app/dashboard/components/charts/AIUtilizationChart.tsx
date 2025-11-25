"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type TokenPoint = { month: string; input: number; output: number };
type CyclePoint = { label: string; count: number };

type AIUtilizationChartProps = {
  tokens: TokenPoint[];
  cycles: CyclePoint[];
};

const CYCLE_COLORS = ["#2563eb", "#9333ea", "#0ea5e9", "#1e293b"];

export function AIUtilizationChart({ tokens, cycles }: AIUtilizationChartProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-72 rounded-xl border border-slate-100 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Tokens (M)</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={tokens} stackOffset="expand">
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
            <Legend />
            <Bar dataKey="input" stackId="tokens" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="output" stackId="tokens" fill="#9333ea" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 rounded-xl border border-slate-100 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Reasoning Cycles</p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={cycles}
              dataKey="count"
              nameKey="label"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
            >
              {cycles.map((entry, idx) => (
                <Cell key={entry.label} fill={CYCLE_COLORS[idx % CYCLE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
