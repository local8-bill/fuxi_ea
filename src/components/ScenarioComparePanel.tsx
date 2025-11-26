"use client";

type Scenario = {
  label: string;
  systems: number;
  integrations: number;
  roi: number;
  risk: number;
  note?: string;
};

function formatPct(n: number) {
  return `${n > 0 ? "+" : ""}${Math.round(n)}%`;
}

export function ScenarioComparePanel({ baseline }: { baseline?: { systems: number; integrations: number } }) {
  const current: Scenario = {
    label: "Current",
    systems: baseline?.systems ?? 42,
    integrations: baseline?.integrations ?? 118,
    roi: 0,
    risk: 0,
    note: "Derived from latest Lucid ingestion",
  };

  const target: Scenario = {
    label: "Target (Simulated)",
    systems: Math.round(current.systems * 0.95),
    integrations: Math.round(current.integrations * 1.08),
    roi: 12,
    risk: -8,
    note: "Goal: consolidate low-value systems, improve flow",
  };

  const deltas = {
    systems: target.systems - current.systems,
    integrations: target.integrations - current.integrations,
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Scenario Compare (beta)</div>
          <div className="text-xs text-slate-500">Current vs Target view — placeholder until scenario API lands.</div>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">
          Export snapshot
        </button>
      </div>

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
