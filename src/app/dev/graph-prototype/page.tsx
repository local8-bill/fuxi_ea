"use client";

import { useMemo, useState, type ReactNode } from "react";
import { UXShellLayout } from "@/components/uxshell/UXShellLayout";
import { emitTelemetry } from "@/components/uxshell/telemetry";

const guidedFocusOptions = [
  { id: "domain", label: "By Domain", helper: "Clusters by business function." },
  { id: "goal", label: "By Goal", helper: "Highlights strategic objectives." },
  { id: "stage", label: "By Stage", helper: "Filters by transformation phase." },
];

const viewModes = [
  { id: "systems", label: "Systems", helper: "Systems + integrations." },
  { id: "domain", label: "Domain", helper: "Value stream halos." },
  { id: "roi", label: "ROI", helper: "Impact vs cost gradients." },
  { id: "sequencer", label: "Sequencer", helper: "Timeline overlays." },
  { id: "capabilities", label: "Capabilities", helper: "Hierarchy & scoring." },
];

const revealStages = [
  { id: "orientation", label: "Orientation", tone: "Calm", summary: "Domains only" },
  { id: "exploration", label: "Exploration", tone: "Curious", summary: "Nodes per domain" },
  { id: "connectivity", label: "Connectivity", tone: "Energized", summary: "All systems + edges" },
  { id: "insight", label: "Insight", tone: "Analytical", summary: "ROI / TCC overlays" },
];

const mockGraph = [
  {
    id: "commerce",
    title: "Commerce",
    color: "from-amber-200 via-amber-100 to-amber-50",
    systems: [
      { id: "com-web", title: "Web Storefront", impact: 0.7, stage: "current" },
      { id: "com-pos", title: "Retail POS", impact: 0.4, stage: "near" },
      { id: "com-loyalty", title: "Loyalty Engine", impact: 0.6, stage: "future" },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    color: "from-sky-200 via-sky-100 to-sky-50",
    systems: [
      { id: "fin-erp", title: "ERP Core", impact: 0.9, stage: "current" },
      { id: "fin-close", title: "Close Automation", impact: 0.5, stage: "near" },
      { id: "fin-analytics", title: "Finance Analytics", impact: 0.6, stage: "future" },
    ],
  },
  {
    id: "supply",
    title: "Supply Chain",
    color: "from-emerald-200 via-emerald-100 to-emerald-50",
    systems: [
      { id: "sup-planning", title: "Demand Planning", impact: 0.55, stage: "current" },
      { id: "sup-wms", title: "Warehouse Ops", impact: 0.45, stage: "near" },
      { id: "sup-logistics", title: "Logistics Mesh", impact: 0.65, stage: "future" },
    ],
  },
];

export default function GraphPrototypePage() {
  const [focus, setFocus] = useState("domain");
  const [mode, setMode] = useState("systems");
  const [stage, setStage] = useState("orientation");

  const stageMeta = useMemo(() => revealStages.find((s) => s.id === stage) ?? revealStages[0], [stage]);

  const handleFocusChange = (next: string) => {
    setFocus(next);
    void emitTelemetry("graph_focus_changed", { focus: next, workspace_id: "prototype" });
  };

  const handleModeChange = (next: string) => {
    setMode(next);
    void emitTelemetry("graph_mode_changed", { mode: next, workspace_id: "prototype" });
  };

  const handleStageChange = (next: string) => {
    setStage(next);
    void emitTelemetry("graph_stage_revealed", { stage: next, workspace_id: "prototype" });
  };

  return (
    <UXShellLayout sidebarHidden sidebar={null}>
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Prototype</p>
            <h1 className="text-3xl font-semibold text-slate-900">Digital Twin Graph — Visual Grammar</h1>
            <p className="text-sm text-slate-600">Static iteration for layout, guided focus, and reveal rhythm.</p>
          </header>

          <section className="grid gap-4 lg:grid-cols-3">
            <ControlPanel title="Guided Focus">
              {guidedFocusOptions.map((option) => (
                <ControlButton
                  key={option.id}
                  active={focus === option.id}
                  label={option.label}
                  helper={option.helper}
                  onClick={() => handleFocusChange(option.id)}
                />
              ))}
            </ControlPanel>

            <ControlPanel title="View Mode">
              {viewModes.map((vm) => (
                <ControlButton
                  key={vm.id}
                  active={mode === vm.id}
                  label={vm.label}
                  helper={vm.helper}
                  onClick={() => handleModeChange(vm.id)}
                />
              ))}
            </ControlPanel>

            <ControlPanel title="Reveal States">
              {revealStages.map((rs) => (
                <ControlButton
                  key={rs.id}
                  active={stage === rs.id}
                  label={`${rs.label} · ${rs.tone}`}
                  helper={rs.summary}
                  onClick={() => handleStageChange(rs.id)}
                />
              ))}
            </ControlPanel>
          </section>

          <GraphCanvas focus={focus} mode={mode} stage={stage} stageMeta={stageMeta} />
        </div>
      </div>
    </UXShellLayout>
  );
}

function ControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function ControlButton({ active, label, helper, onClick }: { active: boolean; label: string; helper: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <p className="font-semibold">{label}</p>
      <p className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>{helper}</p>
    </button>
  );
}

function GraphCanvas({
  focus,
  mode,
  stage,
  stageMeta,
}: {
  focus: string;
  mode: string;
  stage: string;
  stageMeta: (typeof revealStages)[number];
}) {
  const showEdges = stage === "connectivity" || stage === "insight";
  const showNodes = stage !== "orientation";
  const showOverlays = stage === "insight";
  const eAgentMessage = useMemo(() => {
    if (focus === "domain") return "I’ve highlighted your domains.";
    if (focus === "goal") return "Focus set to enterprise goals.";
    return "Viewing by transformation stage.";
  }, [focus]);

  return (
    <section className="relative rounded-[32px] border border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-100 p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Graph Canvas</p>
          <p className="text-sm text-slate-600">Stage · {stageMeta.label} — {stageMeta.summary}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-2 text-xs text-emerald-700 shadow">
          <p className="font-semibold">EAgent</p>
          <p>{eAgentMessage}</p>
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
        {mockGraph.map((domain) => (
          <div key={domain.id} className="rounded-[28px] border border-white/70 bg-white/60 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{domain.title}</p>
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{focus === "stage" ? "Stage" : "Domain"}</span>
            </div>
            <div className={`mt-3 space-y-3 rounded-2xl bg-gradient-to-b ${domain.color} p-3`}>
              {showNodes ? (
                domain.systems.map((system) => (
                  <div
                    key={system.id}
                    className={`rounded-2xl border px-3 py-2 text-sm shadow-sm ${
                      mode === "roi" ? "border-rose-200 bg-white/70" : "border-slate-200 bg-white"
                    } ${focus === "stage" && system.stage === "future" ? "opacity-60" : "opacity-100"}`}
                  >
                    <p className="font-semibold text-slate-800">{system.title}</p>
                    <p className="text-xs text-slate-500">Impact score · {(system.impact * 100).toFixed(0)}%</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-700">Domains only — nodes hidden.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showEdges ? (
        <div className="pointer-events-none absolute inset-6">
          <svg className="h-full w-full">
            <line x1="20%" y1="30%" x2="50%" y2="60%" stroke="rgba(15,23,42,0.15)" strokeWidth="2" />
            <line x1="50%" y1="60%" x2="80%" y2="40%" stroke="rgba(15,23,42,0.15)" strokeWidth="2" />
            <line x1="20%" y1="50%" x2="80%" y2="70%" stroke="rgba(15,23,42,0.1)" strokeWidth="1" strokeDasharray="6" />
          </svg>
        </div>
      ) : null}

      {showOverlays ? (
        <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm text-rose-700 shadow">
          <p className="font-semibold">ROI Overlay</p>
          <p className="text-xs">High-impact zones glowing · ready for Sequencer</p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 right-4 rounded-2xl border border-slate-200 bg-white/80 p-2 text-xs text-slate-500 shadow">
        Mini-map
      </div>
    </section>
  );
}
