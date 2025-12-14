"use client";

import { useState } from "react";
import { Rail } from "@/components/layout/Rail";
import { Stage } from "@/components/layout/Stage";
import { OptionMenu } from "@/components/layout/OptionMenu";

const scenes = [
  { id: "digital", label: "Digital Twin" },
  { id: "sequencer", label: "Sequencer" },
  { id: "intelligence", label: "Org Intelligence" },
];

const quickActions = [
  { id: "focus", label: "Focus Mode", helper: "Collapse rails" },
  { id: "simulate", label: "Simulate Sequence", helper: "Play / Step" },
  { id: "export", label: "Export Plan", helper: "Download JSON" },
];

export default function SequenceTemplatePage() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen gap-4 bg-[#111123] px-6 py-6 text-white">
      <div className="fixed left-6 top-6 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Sequence Template</div>
      <main className="flex w-full gap-4">
        <Rail side="left" collapsed={leftCollapsed} onToggle={() => setLeftCollapsed((prev) => !prev)} title="Scenes">
          <nav className="space-y-2">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                className="w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {scene.label}
              </button>
            ))}
          </nav>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Focus States</p>
            <div className="space-y-1 text-sm text-white">
              <button className="w-full rounded-lg border border-white/10 px-3 py-2 text-left hover:border-white/30">Orientation · Calm</button>
              <button className="w-full rounded-lg border border-white/10 px-3 py-2 text-left hover:border-white/30">Exploration · Curious</button>
              <button className="w-full rounded-lg border border-white/10 px-3 py-2 text-left hover:border-white/30">Connectivity · Energized</button>
              <button className="w-full rounded-lg border border-white/10 px-3 py-2 text-left hover:border-white/30">Insight · Analytical</button>
            </div>
          </div>
        </Rail>

        <Stage>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              {["Plan", "Simulate", "Measure"].map((label) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-[#1b1b2c] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">{label}</p>
                  <p className="mt-2 text-sm text-white">
                    {label === "Plan" && "Queue modernization steps and dependencies."}
                    {label === "Simulate" && "Play the sequence to observe ROI and TCC impact."}
                    {label === "Measure" && "Capture telemetry deltas and readiness scoring."}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-[#151522] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Stage</p>
                <div className="flex gap-2 text-xs">
                  {["FY26", "FY27", "FY28"].map((phase) => (
                    <button key={phase} className="rounded-full border border-white/15 px-3 py-1 text-white hover:bg-white/10">
                      {phase}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15">
                <p className="text-sm text-[#a1a1aa]">Graph canvas placeholder — mount ReactFlow/Sequence view here.</p>
              </div>
            </div>
          </div>
        </Stage>

        <Rail side="right" collapsed={rightCollapsed} onToggle={() => setRightCollapsed((prev) => !prev)} title="Insights">
          <OptionMenu />
          <div className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Quick Actions</p>
            <div className="mt-3 space-y-2">
              {quickActions.map((action) => (
                <button key={action.id} type="button" className="w-full rounded-lg border border-white/15 px-3 py-2 text-left hover:bg-white/10">
                  <span className="block font-semibold">{action.label}</span>
                  <span className="text-xs text-[#a1a1aa]">{action.helper}</span>
                </button>
              ))}
            </div>
          </div>
        </Rail>
      </main>
    </div>
  );
}
