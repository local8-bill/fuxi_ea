"use client";

import Link from "next/link";
import { useState } from "react";
import { ModeSelector } from "./ModeSelector";
import { InsightPanel } from "./InsightPanel";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";

type StageView = "graph" | "roi" | "sequencer" | "review";

export function UnifiedLayout({ projectId }: { projectId?: string }) {
  const [view, setView] = useState<StageView>("graph");

  const handleContextSwitch = (next: StageView) => {
    setView(next);
    void emitTelemetry("context_switch", { view: next, projectId });
  };

  const renderStage = () => {
    const targetProject = projectId ?? "demo";
    const baseCls = "uxshell-card rounded-2xl bg-white p-4 h-full";
    switch (view) {
      case "roi":
        return (
          <div className={`${baseCls} flex flex-col gap-2`}>
            <p className="text-sm font-semibold text-slate-900">ROI Dashboard</p>
            <p className="text-sm text-slate-600">
              View ROI summary and cost/benefit trends. This links to the live ROI dashboard for project {targetProject}.
            </p>
            <Link href={`/project/${targetProject}/roi-dashboard`} className="text-indigo-600 text-sm font-semibold">
              Open ROI Dashboard →
            </Link>
          </div>
        );
      case "sequencer":
        return (
          <div className={`${baseCls} flex flex-col gap-2`}>
            <p className="text-sm font-semibold text-slate-900">Transformation Sequencer</p>
            <p className="text-sm text-slate-600">
              Build multi-stage roadmaps and validate stage costs. This links to the transformation dialogue workspace.
            </p>
            <Link href={`/project/${targetProject}/transformation-dialogue`} className="text-indigo-600 text-sm font-semibold">
              Open Sequencer →
            </Link>
          </div>
        );
      case "review":
        return (
          <div className={`${baseCls} flex flex-col gap-2`}>
            <p className="text-sm font-semibold text-slate-900">Harmonization Review</p>
            <p className="text-sm text-slate-600">Review harmonized graph deltas before publishing to Digital Enterprise.</p>
            <Link href={`/project/${targetProject}/harmonization-review`} className="text-indigo-600 text-sm font-semibold">
              Open Review →
            </Link>
          </div>
        );
      case "graph":
      default:
        return (
          <div className={`${baseCls} flex flex-col gap-2`}>
            <p className="text-sm font-semibold text-slate-900">Living Map (Graph)</p>
            <p className="text-sm text-slate-600">Explore domains, edges, and timeline overlays.</p>
            <Link href={`/project/${targetProject}/digital-enterprise`} className="text-indigo-600 text-sm font-semibold">
              Open Graph →
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="uxshell-root px-6 py-8">
      <div className="uxshell-shell mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white/70 shadow-xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_320px] p-6">
          <div className="space-y-6">
            <ModeSelector />
            <div className="space-y-2">
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Views</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "graph", label: "Graph" },
                  { id: "roi", label: "ROI" },
                  { id: "sequencer", label: "Sequencer" },
                  { id: "review", label: "Review" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleContextSwitch(v.id as StageView)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      view === v.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="uxshell-stage">{renderStage()}</div>

          <div className="space-y-6">
            <InsightPanel />
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-white/80 rounded-b-3xl">
          <PromptBar />
        </div>
      </div>
    </div>
  );
}
