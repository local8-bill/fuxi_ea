"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";
import { Sidebar } from "./Sidebar";
import GraphEmbed from "./embeds/GraphEmbed";
import ROISummaryEmbed from "./embeds/ROISummaryEmbed";
import SequencerEmbed from "./embeds/SequencerEmbed";
import ReviewEmbed from "./embeds/ReviewEmbed";

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
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="grid grid-cols-[280px_1fr] gap-10">
          {/* Left rail (independent column) */}
          <div className="flex flex-col gap-6">
            <Sidebar
              projectId={targetProject}
              currentProjectId={targetProject}
              onModeChange={(mode) => emitTelemetry("uxshell_mode_changed", { projectId: targetProject, mode })}
            />
        </div>

          {/* Command deck + workspace preview */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow">
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Command Deck</p>
                <p className="text-3xl font-semibold text-slate-900">What can I help with?</p>
                <p className="text-sm text-slate-600">Ask in natural language or jump into a view.</p>
              <PromptBar
                onAction={(action) => {
                  if (action.target) {
                    const href = `/project/${targetProject}/${action.target}`;
                    void emitTelemetry("uxshell_action_invoked", { view: action.view, target: action.target });
                    window.location.href = href;
                  }
                }}
              />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
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

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow">
              {activeView === "graph" && <GraphEmbed projectId={targetProject} />}
              {activeView === "roi" && (
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <ROISummaryEmbed projectId={targetProject} />
                  <SequencerEmbed projectId={targetProject} />
                </div>
              )}
              {activeView === "sequencer" && <SequencerEmbed projectId={targetProject} />}
              {activeView === "review" && <ReviewEmbed projectId={targetProject} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
