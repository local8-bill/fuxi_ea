"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModeSelector } from "./ModeSelector";
import { InsightPanel } from "./InsightPanel";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";
import { NavSidebar } from "./NavSidebar";

type View = "graph" | "roi" | "sequencer" | "review";

const projects = [
  { id: "700am", name: "700am — Core", status: "live" },
  { id: "951pm", name: "951pm — Pilot", status: "draft" },
  { id: "demo", name: "Demo Workspace", status: "demo" },
];

export function UnifiedLayout({ projectId }: { projectId?: string }) {
  const [activeView, setActiveView] = useState<View>("graph");
  const targetProject = projectId ?? projects[0]?.id ?? "demo";

  useEffect(() => {
    void emitTelemetry("uxshell_loaded", { projectId: targetProject });
  }, [targetProject]);

  const handleView = (next: View) => {
    setActiveView(next);
    void emitTelemetry("uxshell_view_selected", { view: next, projectId: targetProject });
  };

  return (
    <div className="uxshell-root px-6 py-8">
      <div className="uxshell-shell mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white/70 shadow-xl">
        <div className="flex items-center justify-between px-6 pt-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Unified Experience</p>
            <p className="text-lg font-semibold text-slate-900">Project {projectId ?? "demo"}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Live</span>
            <Link href="/uxshell" className="text-indigo-600 font-semibold">
              Demo Shell
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px] p-6">
          <div className="space-y-6">
            <ModeSelector />
            <NavSidebar projectId={targetProject} />
          </div>

          <div className="uxshell-stage">
            <div className="uxshell-card rounded-2xl bg-white p-6 h-full flex flex-col gap-6">
              <div className="space-y-1">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Command Deck</p>
                <p className="text-2xl font-semibold text-slate-900">What can I help with?</p>
                <p className="text-sm text-slate-600">Ask in natural language or jump into a view.</p>
              </div>

              <PromptBar
                onAction={(action) => {
                  if (action.target) {
                    const href = `/project/${targetProject}/${action.target}`;
                    void emitTelemetry("uxshell_action_invoked", { view: action.view, target: action.target });
                    window.location.href = href;
                  }
                }}
              />

              <div className="space-y-3">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Views</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "graph", label: "Graph", href: `/project/${targetProject}/digital-enterprise` },
                    { id: "roi", label: "ROI", href: `/project/${targetProject}/roi-dashboard` },
                    { id: "sequencer", label: "Sequencer", href: `/project/${targetProject}/transformation-dialogue` },
                    { id: "review", label: "Review", href: `/project/${targetProject}/harmonization-review` },
                  ].map((v) => (
                    <Link
                      key={v.id}
                      href={v.href}
                      onClick={() => handleView(v.id as View)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold border ${
                        activeView === v.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200"
                      }`}
                    >
                      {v.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
                  <p className="text-sm text-slate-800 mt-1">Project {targetProject} · Mode: Architect</p>
                  <p className="text-sm text-slate-600">Recent activity: ROI dashboard updated, graph synced.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Next actions</p>
                  <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                    <li>Review graph for Finance domain</li>
                    <li>Validate ROI assumptions for Commerce</li>
                    <li>Advance Sequencer to Stage 2</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <InsightPanel projectId={targetProject} />
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-white/80 rounded-b-3xl">
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500 mb-2">Quick prompt</p>
          <PromptBar />
        </div>
      </div>
    </div>
  );
}
