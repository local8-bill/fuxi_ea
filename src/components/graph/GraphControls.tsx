"use client";

import clsx from "clsx";
import type { GraphFocus, GraphViewMode, GraphRevealStage } from "@/hooks/useGraphTelemetry";

interface GraphControlsProps {
  focusSummary: string;
  focus: GraphFocus;
  viewMode: GraphViewMode;
  stage: GraphRevealStage;
  onViewModeChange?: (mode: GraphViewMode) => void;
  onStageChange?: (stage: GraphRevealStage) => void;
}

const viewOptions: Array<{ id: GraphViewMode; label: string }> = [
  { id: "systems", label: "Systems" },
  { id: "domain", label: "Domain" },
  { id: "roi", label: "ROI" },
  { id: "sequencer", label: "Sequencer" },
  { id: "capabilities", label: "Capabilities" },
];

const stageOptions: Array<{ id: GraphRevealStage; label: string }> = [
  { id: "orientation", label: "Orientation" },
  { id: "exploration", label: "Exploration" },
  { id: "connectivity", label: "Connectivity" },
  { id: "insight", label: "Insight" },
];

export function GraphControls({ focusSummary, focus, viewMode, stage, onStageChange, onViewModeChange }: GraphControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 flex flex-wrap justify-between gap-4 px-6">
      <div className="pointer-events-auto rounded-3xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Guided Focus</p>
        <p className="text-sm font-semibold text-slate-900">{focus === "goal" ? "Goal lens" : focus === "stage" ? "Sequencing" : "Domain lens"}</p>
        <p className="text-[0.7rem] text-slate-600">{focusSummary}</p>
      </div>
      <div className="pointer-events-auto flex flex-col gap-3 text-xs">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">View Mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={clsx(
                  "rounded-full px-3 py-1.5 text-[0.65rem] font-semibold transition",
                  viewMode === option.id ? "bg-slate-900 text-white" : "bg-white text-slate-800 border border-slate-200",
                )}
                onClick={() => onViewModeChange?.(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Reveal</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stageOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={clsx(
                  "rounded-full px-3 py-1.5 text-[0.65rem] font-semibold transition",
                  stage === option.id ? "bg-emerald-500 text-white" : "bg-white text-slate-800 border border-slate-200",
                )}
                onClick={() => onStageChange?.(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
