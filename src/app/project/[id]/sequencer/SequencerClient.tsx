"use client";

import { useMemo, useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { SequencerResult, SequencedSystem } from "@/domain/services/sequencer";

type Props = {
  projectId: string;
  data: SequencerResult | null;
};

type Mode = "current" | "future" | "sequence";

function stateColor(state: SequencedSystem["state"]) {
  switch (state) {
    case "Add":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Modify":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Retire":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200";
  }
}

export default function SequencerClient({ projectId, data }: Props) {
  const { log } = useTelemetry("transformation_dialogue", { projectId });
  const [mode, setMode] = useState<Mode>("sequence");

  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [], stages: 0 };
    if (mode === "current") {
      return {
        ...data,
        nodes: data.nodes.filter((n) => n.state === "Retain" || n.state === "Modify" || n.state === "Retire"),
      };
    }
    if (mode === "future") {
      return {
        ...data,
        nodes: data.nodes.filter((n) => n.state === "Retain" || n.state === "Modify" || n.state === "Add"),
      };
    }
    return data;
  }, [data, mode]);

  const stages = useMemo(() => {
    const byStage = new Map<number, SequencedSystem[]>();
    filtered.nodes.forEach((n) => {
      const s = n.sequence_stage || 1;
      if (!byStage.has(s)) byStage.set(s, []);
      byStage.get(s)!.push(n);
    });
    return Array.from(byStage.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([stage, nodes]) => ({
        stage,
        nodes: nodes.sort((a, b) => a.domain.localeCompare(b.domain) || a.system.localeCompare(b.system)),
      }));
  }, [filtered.nodes]);

  const handleExport = (format: "csv" | "json") => {
    if (!data) return;
    const rows = data.nodes.map((n) => ({
      stage: n.sequence_stage,
      system: n.system,
      domain: n.domain,
      state: n.state,
      dependencies: n.dependencies.join("; "),
      confidence: n.confidence,
    }));
    log("sequencer_export", { format, count: rows.length });
    if (format === "json") {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transformation_sequence.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const header = "Stage,System,Domain,State,Dependencies,Confidence";
      const body = rows
        .map((r) =>
          [r.stage, r.system, r.domain, r.state, `"${r.dependencies.replace(/"/g, '""')}"`, r.confidence.toFixed(2)].join(","),
        )
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transformation_sequence.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Transformation Sequencer</h1>
        <p className="mt-3 text-slate-600">No sequencer data generated yet. Upload mock data and refresh.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transformation Sequencer</p>
          <h1 className="text-2xl font-bold text-slate-900">Current → Future transition plan</h1>
          <p className="mt-2 text-slate-600">Stages are inferred from dependencies; toggle views and export the plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              mode === "current" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
            onClick={() => setMode("current")}
          >
            Show Current
          </button>
          <button
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              mode === "future" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
            onClick={() => setMode("future")}
          >
            Show Future
          </button>
          <button
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              mode === "sequence" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
            onClick={() => setMode("sequence")}
          >
            Show Sequence
          </button>
          <button
            className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white"
            onClick={() => handleExport("csv")}
          >
            Export CSV
          </button>
          <button
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800"
            onClick={() => handleExport("json")}
          >
            Export JSON
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Metric label="Total systems" value={data.summary.total} />
        <Metric label="Add" value={data.summary.add} tone="emerald" />
        <Metric label="Retire" value={data.summary.retire} tone="rose" />
        <Metric label="Modify / Retain" value={`${data.summary.modify} / ${data.summary.retain}`} />
      </section>

      <section className="mt-6 space-y-4">
        {stages.map((stage) => (
          <div key={stage.stage} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Stage {stage.stage}</h3>
              <span className="text-xs text-slate-600">
                {stage.nodes.length} system{stage.nodes.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {stage.nodes.map((n) => (
                <div
                  key={n.system}
                  className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm md:w-[240px] ${stateColor(n.state)}`}
                  onClick={() => log("sequencer_focus_node", { system: n.system, stage: n.sequence_stage })}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{n.system}</span>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {n.state}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-700">Domain: {n.domain}</div>
                  <div className="mt-1 text-xs text-slate-700">Confidence: {Math.round(n.confidence * 100)}%</div>
                  {n.dependencies.length ? (
                    <div className="mt-1 text-[11px] text-slate-700">
                      Deps: {n.dependencies.join(", ")}
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-slate-500">No dependencies</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "emerald" | "rose" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "rose"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : "bg-slate-50 text-slate-800 border-slate-200";
  return (
    <div className={`rounded-2xl border ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
