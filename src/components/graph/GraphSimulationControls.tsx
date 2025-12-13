"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export type GraphTimelineBand = {
  id: string;
  label: string;
  summary?: string;
};

export type PhaseInsight = {
  phase: string;
  label: string;
  roi: number;
  tcc: number;
  risk: number;
};

export function riskState(value?: number) {
  if (typeof value !== "number") return { label: "Unknown", className: "text-slate-500" };
  if (value >= 0.65) return { label: "High", className: "text-rose-600" };
  if (value >= 0.45) return { label: "Medium", className: "text-amber-600" };
  return { label: "Low", className: "text-emerald-600" };
}

interface SimulationControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  onStep: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  phases: GraphTimelineBand[];
  activePhase: string;
  onScrub: (phaseId: string) => void;
  extra?: ReactNode;
  storeOverlayEnabled?: boolean;
  onStoreOverlayToggle?: (value: boolean) => void;
  showTimeline?: boolean;
}

const SPEED_PRESETS = [
  { label: "Calm", value: 3400 },
  { label: "Balanced", value: 2600 },
  { label: "Fast", value: 1800 },
];

export function GraphSimulationControls({
  isPlaying,
  onToggle,
  onStep,
  speed,
  onSpeedChange,
  phases,
  activePhase,
  onScrub,
  extra,
  storeOverlayEnabled,
  onStoreOverlayToggle,
  showTimeline = true,
}: SimulationControlsProps) {
  return (
    <div className="space-y-3">
      <section className="rounded-[32px] border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Simulation Controls</p>
            <p className="text-xs text-neutral-500">Phase playback · ROI/TCC overlays · stage reveal</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className={clsx(
                "rounded-full px-3 py-1 text-[0.65rem] font-semibold transition",
                isPlaying ? "bg-rose-100 text-rose-600" : "bg-neutral-900 text-white",
              )}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={onStep}
              className="rounded-full border border-neutral-200 px-3 py-1 text-[0.65rem] font-semibold text-neutral-700"
            >
              Step →
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Speed</p>
          <div className="flex flex-wrap gap-1">
            {SPEED_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onSpeedChange(preset.value)}
                className={clsx(
                  "rounded-full border px-3 py-1 text-[0.6rem] font-semibold",
                  speed === preset.value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {extra ? <div className="mt-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">{extra}</div> : null}
      </section>

      {showTimeline ? (
        <section className="rounded-[28px] border border-neutral-200 bg-neutral-50/95 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Timeline</p>
              <div className="flex flex-wrap gap-2">
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => onScrub(phase.id)}
                    className={clsx(
                      "rounded-full border px-4 py-1 text-[0.65rem] font-semibold transition",
                      activePhase === phase.id ? "border-emerald-600 bg-emerald-600 text-white" : "border-neutral-200 bg-white text-neutral-600",
                    )}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            </div>
            {typeof storeOverlayEnabled === "boolean" && onStoreOverlayToggle ? (
              <label className="ml-auto flex items-center gap-2 text-[0.65rem] font-semibold text-neutral-600">
                <input
                  type="checkbox"
                  checked={storeOverlayEnabled}
                  onChange={(event) => onStoreOverlayToggle(event.target.checked)}
                  className="rounded border-neutral-300 accent-neutral-900"
                />
                Store overlay
              </label>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

interface PhaseInsightStripProps {
  insights: PhaseInsight[];
  activePhase: string;
  onSelect: (phase: string) => void;
}

export function PhaseInsightStrip({ insights, activePhase, onSelect }: PhaseInsightStripProps) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 px-4 py-3 shadow-sm">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Phase ROI Overview</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {insights.map((insight) => {
          const state = riskState(insight.risk);
          return (
            <button
              key={insight.phase}
              data-phase-pill
              data-state={activePhase === insight.phase ? "active" : "default"}
              type="button"
              onClick={() => onSelect(insight.phase)}
              className={`rounded-2xl border px-3 py-2 text-left text-sm shadow-sm ${
                activePhase === insight.phase ? "border-indigo-500 bg-indigo-50" : "border-neutral-200 bg-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">{insight.label}</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{(insight.roi * 100).toFixed(0)}% ROI</p>
              <p className="text-xs text-neutral-500">TCC ${(insight.tcc ?? 0).toFixed(1)}M</p>
              <p className={`text-xs font-semibold ${state.className}`}>{state.label} risk</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
