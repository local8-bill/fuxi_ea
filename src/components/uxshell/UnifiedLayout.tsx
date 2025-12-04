"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ModeSelector } from "./ModeSelector";
import { InsightPanel } from "./InsightPanel";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";

type StageView = "graph" | "roi" | "sequencer" | "review";

// Lazy-load heavy views to keep shell snappy
const LivingMapEmbed = dynamic(() => import("./embeds/LivingMapEmbed"), { ssr: false, loading: () => <EmbedSkeleton /> });
const ROISummaryEmbed = dynamic(() => import("./embeds/ROISummaryEmbed"), { ssr: false, loading: () => <EmbedSkeleton /> });
const SequencerEmbed = dynamic(() => import("./embeds/SequencerEmbed"), { ssr: false, loading: () => <EmbedSkeleton /> });
const ReviewEmbed = dynamic(() => import("./embeds/ReviewEmbed"), { ssr: false, loading: () => <EmbedSkeleton /> });

function EmbedSkeleton() {
  return <div className="uxshell-card rounded-2xl bg-white p-4 h-full animate-pulse text-slate-400">Loading…</div>;
}

export function UnifiedLayout({ projectId }: { projectId?: string }) {
  const [view, setView] = useState<StageView>("graph");

  useEffect(() => {
    void emitTelemetry("context_switch", { view: "graph", projectId: projectId ?? "demo" });
  }, [projectId]);

  const handleContextSwitch = (next: StageView) => {
    setView(next);
    void emitTelemetry("context_switch", { view: next, projectId });
  };

  const renderStage = () => {
    const targetProject = projectId ?? "demo";
    const baseCls = "uxshell-card rounded-2xl bg-white p-4 h-full";
    switch (view) {
      case "roi":
        return <ROISummaryEmbed projectId={targetProject} />;
      case "sequencer":
        return <SequencerEmbed projectId={targetProject} />;
      case "review":
        return <ReviewEmbed projectId={targetProject} />;
      case "graph":
      default:
        return <LivingMapEmbed projectId={targetProject} />;
    }
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
