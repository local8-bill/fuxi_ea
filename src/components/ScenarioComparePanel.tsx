"use client";

import { useState } from "react";

type Scenario = {
  label: string;
  systems: number;
  integrations: number;
  roi: number; // lift points
  risk: number; // delta points (negative is better)
  note?: string;
};

function formatPct(n: number) {
  return `${n > 0 ? "+" : ""}${Math.round(n)}%`;
}

type Mode = "consolidate" | "modernize" | "optimize";

function deriveTarget(current: Scenario, mode: Mode): Scenario {
  switch (mode) {
    case "consolidate":
      return {
        label: "Target (Consolidate)",
        systems: Math.round(current.systems * 0.92),
        integrations: Math.round(current.integrations * 1.05),
        roi: 10,
        risk: -6,
        note: "Fewer systems, slightly denser integrations",
      };
    case "modernize":
      return {
        label: "Target (Modernize)",
        systems: Math.round(current.systems * 0.97),
        integrations: Math.round(current.integrations * 1.1),
        roi: 14,
        risk: -10,
        note: "Retire legacy, add API-first flows",
      };
    case "optimize":
    default:
      return {
        label: "Target (Optimize)",
        systems: Math.round(current.systems * 0.98),
        integrations: Math.round(current.integrations * 1.15),
        roi: 18,
        risk: -12,
        note: "Flow-first, automation emphasis",
      };
  }
}

export function ScenarioComparePanel({
  baseline,
  roiSignal,
}: {
  baseline?: { systems: number; integrations: number };
  roiSignal?: number | null; // e.g., break-even month or ROI lift from sim
}) {
  const [mode, setMode] = useState<Mode>("modernize");

  const current: Scenario = {
    label: "Current",
    systems: baseline?.systems ?? 0,
    integrations: baseline?.integrations ?? 0,
    roi: 0,
    risk: 0,
    note: "Derived from latest Lucid ingestion",
  };

  const baseTarget = deriveTarget(current, mode);
  const roiAdjustment = roiSignal != null ? Math.max(4, 24 - roiSignal) : 0;
  const target: Scenario = {
    ...baseTarget,
    roi: baseTarget.roi + roiAdjustment,
  };

  const deltas = {
    systems: target.systems - current.systems,
    integrations: target.integrations - current.integrations,
  };

  const hasBaseline = current.systems > 0 || current.integrations > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Scenario Compare (beta)</div>
          <div className="text-xs text-slate-500">Current vs Target view — placeholder until scenario API lands.</div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} setMode={setMode} />
          <ExportButtons current={current} target={target} />
        </div>
      </div>

      {!hasBaseline && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No baseline metrics detected yet. Once systems/integration counts are available, this will model Target deltas.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ScenarioCard data={current} />
        <ScenarioCard data={target} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-700">
        <Delta label="Systems" value={deltas.systems} />
        <Delta label="Integrations" value={deltas.integrations} />
        <Delta label="ROI Lift" value={target.roi} suffix=" pts" />
        <Delta label="Risk Delta" value={target.risk} suffix=" pts" inverse />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-2 py-2">Scenario</th>
              <th className="px-2 py-2">Systems</th>
              <th className="px-2 py-2">Integrations</th>
              <th className="px-2 py-2">ROI Lift</th>
              <th className="px-2 py-2">Risk Δ</th>
              <th className="px-2 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {[current, target].map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-2 py-2 font-semibold text-slate-900">{row.label}</td>
                <td className="px-2 py-2 text-slate-700">{row.systems}</td>
                <td className="px-2 py-2 text-slate-700">{row.integrations}</td>
                <td className="px-2 py-2 text-slate-700">{formatPct(row.roi)}</td>
                <td className="px-2 py-2 text-slate-700">{formatPct(row.risk)}</td>
                <td className="px-2 py-2 text-slate-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const options: { key: Mode; label: string }[] = [
    { key: "consolidate", label: "Consolidate" },
    { key: "modernize", label: "Modernize" },
    { key: "optimize", label: "Optimize" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setMode(opt.key)}
          className={`rounded-full px-3 py-1 font-semibold ${
            mode === opt.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ScenarioCard({ data }: { data: Scenario }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{data.label}</div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-600">{data.note}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <Metric label="Systems" value={data.systems} />
        <Metric label="Integrations" value={data.integrations} />
        <Metric label="ROI Lift" value={data.roi} suffix=" pts" />
        <Metric label="Risk" value={data.risk} suffix=" pts" />
      </div>
    </div>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">
        {value}
        {suffix}
      </div>
    </div>
  );
}

function Delta({ label, value, suffix = "", inverse = false }: { label: string; value: number; suffix?: string; inverse?: boolean }) {
  const positive = inverse ? value < 0 : value > 0;
  const tone = positive ? "text-green-700 bg-green-50 border-green-100" : value === 0 ? "text-slate-700 bg-slate-50 border-slate-100" : "text-amber-700 bg-amber-50 border-amber-100";
  return (
    <div className={`rounded-md border px-3 py-2 ${tone}`}>
      <div className="text-[11px] text-slate-600">{label}</div>
      <div className="text-sm font-semibold">
        {formatPct(value)}
        {suffix}
      </div>
    </div>
  );
}

function ExportButtons({ current, target }: { current: Scenario; target: Scenario }) {
  const exportJson = () => {
    const payload = { generatedAt: new Date().toISOString(), current, target };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scenario_compare.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = [
      ["Scenario", "Systems", "Integrations", "ROI Lift (pts)", "Risk Delta (pts)", "Note"],
      [current.label, current.systems, current.integrations, current.roi, current.risk, current.note ?? ""],
      [target.label, target.systems, target.integrations, target.roi, target.risk, target.note ?? ""],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scenario_compare.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={exportJson}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
      >
        Export JSON
      </button>
      <button
        onClick={exportCsv}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
      >
        Export CSV
      </button>
    </div>
  );
}
