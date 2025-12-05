"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";
import { Sidebar } from "./Sidebar";
import { UXShellLayout } from "./UXShellLayout";
import GraphEmbed from "./embeds/GraphEmbed";
import ROISummaryEmbed from "./embeds/ROISummaryEmbed";
import SequencerEmbed from "./embeds/SequencerEmbed";
import ReviewEmbed from "./embeds/ReviewEmbed";
import { useRef } from "react";

type View = "graph" | "roi" | "sequencer" | "review";

const projects = [
  { id: "700am", name: "700am — Core", status: "live" },
  { id: "951pm", name: "951pm — Pilot", status: "draft" },
  { id: "demo", name: "Demo Workspace", status: "demo" },
];

export function UnifiedLayout({ projectId }: { projectId?: string }) {
  const [activeView, setActiveView] = useState<View>("graph");
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const targetProject = projectId ?? projects[0]?.id ?? "demo";

  useEffect(() => {
    void emitTelemetry("uxshell_loaded", { projectId: targetProject });
    // layout guard
    const width = sidebarRef.current?.offsetWidth ?? 0;
    if (width > 320) {
      void emitTelemetry("uxshell_layout_violation", {
        width,
        maxAllowed: 320,
        timestamp: new Date().toISOString(),
      });
    }
  }, [targetProject]);

  const handleView = (next: View) => {
    setActiveView(next);
    void emitTelemetry("uxshell_view_selected", { view: next, projectId: targetProject });
  };

  return (
    <div className="uxshell-root px-0 py-0">
      <UXShellLayout
        sidebar={
          <div ref={sidebarRef}>
            <Sidebar
              projectId={targetProject}
              currentProjectId={targetProject}
              onModeChange={(mode) => emitTelemetry("uxshell_mode_changed", { projectId: targetProject, mode })}
            />
          </div>
        }
      >
        <div className="grid w-full max-w-7xl grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
          {/* Main column */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow">
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

            {/* Command deck pinned low */}
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Command Deck</p>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={() => handleView("graph")}
                >
                  Open view
                </button>
              </div>
              <div className="mt-3">
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
            </div>
          </div>

          {/* Right rail */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow">
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Insights</p>
              <p className="text-sm text-slate-700">Reserve this rail for contextual insights or alerts.</p>
            </div>
          </div>
        </div>
      </UXShellLayout>
    </div>
  );
}
