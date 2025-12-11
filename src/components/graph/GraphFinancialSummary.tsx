"use client";

import clsx from "clsx";

export type PhaseFinancialSummary = {
  id: string;
  label: string;
  costToday: number;
  transitionCost: number;
  valueTomorrow: number;
  roi: number;
  tcc: number;
};

export function GraphFinancialSummary({
  phases,
  activePhase,
}: {
  phases: PhaseFinancialSummary[];
  activePhase: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">ROI / TCC Summary</p>
      <p className="text-sm text-slate-600">Cost today → transition cost → value tomorrow.</p>
      <div className="mt-3 space-y-3">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm transition",
              phase.id === activePhase ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{phase.label}</p>
              <p className="text-xs text-slate-500">ROI {(phase.roi * 100).toFixed(0)}% · TCC ${phase.tcc.toFixed(1)}M</p>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <MetricPill label="Cost Today" value={`$${phase.costToday.toFixed(1)}M`} tone="text-slate-700" />
              <MetricPill label="Transition Cost" value={`$${phase.transitionCost.toFixed(1)}M`} tone="text-amber-600" />
              <MetricPill label="Value Tomorrow" value={`$${phase.valueTomorrow.toFixed(1)}M`} tone="text-emerald-700" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
      <p className="font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={clsx("mt-1 text-sm font-semibold", tone ?? "text-slate-900")}>{value}</p>
    </div>
  );
}
