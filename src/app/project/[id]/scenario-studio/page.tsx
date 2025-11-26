"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import {
  baselineScenario,
  scenarios,
  mergeSeries,
  computeDelta,
  scenarioSuggestions,
} from "@/features/scenario/studioData";

type Lens = "financial" | "technical";

export default function ScenarioStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [scenarioId, setScenarioId] = React.useState(scenarios[0]?.id ?? "modernization");
  const [lens, setLens] = React.useState<Lens>("financial");
  const [horizonIndex, setHorizonIndex] = React.useState(3);

  const scenario = React.useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  const chartData = React.useMemo(
    () => mergeSeries(scenario, baselineScenario),
    [scenario],
  );

  const selectedPoint = chartData[Math.min(horizonIndex, chartData.length - 1)] ?? chartData[chartData.length - 1];
  const deltas = React.useMemo(() => computeDelta(scenario, baselineScenario), [scenario]);
  const suggestions = scenarioSuggestions[scenario.id] ?? [];

  return (
    <div className="px-6 py-8 md:px-8 lg:px-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="D015 · Scenario Studio"
        title="Enterprise Trading Desk"
        description="Simulate portfolio scenarios like tradable assets: compare ROI, risk exposure, and volatility over time with an AI copilot explaining the moves."
      >
        <p className="text-xs text-gray-500 mt-2">
          Project: {id} · Auth optional (labs) · Baseline is always present for comparison. Data currently uses mock Deckers-inspired values until D010 validation wiring lands.
        </p>
      </WorkspaceHeader>

      {/* Controls */}
      <Card className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Scenario</p>
            <select
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Lens</p>
            <div className="flex gap-2">
              {(["financial", "technical"] as Lens[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLens(opt)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${lens === opt ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-700"}`}
                >
                  {opt === "financial" ? "Financial" : "Technical"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Time Horizon</p>
            <input
              type="range"
              min={0}
              max={Math.max(0, chartData.length - 1)}
              value={Math.min(horizonIndex, chartData.length - 1)}
              onChange={(e) => setHorizonIndex(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
            <div className="text-xs text-slate-600 flex justify-between mt-1">
              <span>Start</span>
              <span>{selectedPoint?.label}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Baseline: Current run-rate</span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Scenarios: Modernization · Budget Optimization · Time Compression</span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">Outputs: ROI, Risk Exposure, Volatility band</span>
        </div>
      </Card>

      {/* Metrics + Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">Portfolio Deltas vs Baseline</p>
              <p className="text-xs text-slate-500">Average across horizon; baseline remains the reference line.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Metric
              label={lens === "financial" ? "ROI Delta" : "Alignment Delta"}
              value={deltas.roiDelta}
              suffix="%"
              helper={lens === "financial" ? "((value - cost) / cost) vs baseline" : "Technical lens uses same math until alignment inputs arrive (TODO: D010 mapping)."}
            />
            <Metric
              label="Risk Exposure"
              value={deltas.riskDelta}
              suffix=""
              helper="(1 - TechFit) × (Dependencies + Risk) vs baseline."
            />
            <Metric
              label="Volatility"
              value={deltas.volatilityDelta}
              suffix=""
              helper="Average volatility band change across horizon."
            />
          </div>
        </Card>

        <Card>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-2">AI Trader Copilot</p>
          <p className="text-sm text-slate-700 mb-2">
            Narrative sketch based on deltas; replace with actual AI calls once D015.1 Copilot is wired.
          </p>
          <ul className="list-disc pl-4 space-y-1 text-sm text-slate-800">
            {suggestions.slice(0, 3).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
            {!suggestions.length && <li>AI suggestions will appear here per scenario.</li>}
          </ul>
        </Card>
      </div>

      {/* Visualization */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">Candlestick-inspired view</p>
            <p className="text-xs text-slate-500">Best/Worst band + expected line. Baseline expected is the dashed overlay. Cost is shown as a thin reference line.</p>
          </div>
          <div className="text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 bg-indigo-200 rounded-sm" /> Band: Best/Worst
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 bg-indigo-500 rounded-sm" /> Line: Expected
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 bg-slate-400 rounded-sm" /> Dashed: Baseline expected
            </div>
          </div>
        </div>
        <div className="h-80 min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip formatter={(value: number) => `${Math.round(value * 100)}%`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="best"
                stroke="#818cf8"
                fill="#c7d2fe"
                fillOpacity={0.35}
                name="Best"
              />
              <Area
                type="monotone"
                dataKey="worst"
                stroke="#a5b4fc"
                fill="#e0e7ff"
                fillOpacity={0.25}
                name="Worst"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#4338ca"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name="Expected"
              />
              <Line
                type="monotone"
                dataKey="baselineExpected"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                dot={false}
                name="Baseline"
              />
              <ReferenceLine
                y={selectedPoint?.cost ?? 0}
                stroke="#0f172a"
                strokeDasharray="3 3"
                label={{ value: "Cost", position: "right", fill: "#0f172a", fontSize: 10 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Point-in-time snapshot */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">Snapshot · {selectedPoint?.label}</p>
            <p className="text-xs text-slate-500">Compare scenario vs baseline at the selected time.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Snapshot label="Expected" scenario={selectedPoint?.expected} baseline={selectedPoint?.baselineExpected} />
          <Snapshot label="Best" scenario={selectedPoint?.best} baseline={selectedPoint?.baselineExpected} />
          <Snapshot label="Worst" scenario={selectedPoint?.worst} baseline={selectedPoint?.baselineExpected} />
          <Snapshot label="Cost" scenario={selectedPoint?.cost} baseline={selectedPoint?.baselineCost} />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, suffix, helper }: { label: string; value: number; suffix?: string; helper?: string }) {
  const formatted = Number.isFinite(value) ? (value * 100).toFixed(1) : "—";
  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">
        {formatted}
        {Number.isFinite(value) ? suffix ?? "" : ""}
      </p>
      {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </div>
  );
}

function Snapshot({ label, scenario, baseline }: { label: string; scenario?: number; baseline?: number }) {
  const delta = (scenario ?? 0) - (baseline ?? 0);
  const fmt = (v?: number) => (Number.isFinite(v ?? NaN) ? `${Math.round((v ?? 0) * 100)}%` : "—");
  const deltaFmt = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%` : "—";
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{fmt(scenario)}</p>
      <p className="text-xs text-slate-600">Baseline: {fmt(baseline)}</p>
      <p className={`text-xs font-medium ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{deltaFmt}</p>
    </div>
  );
}
