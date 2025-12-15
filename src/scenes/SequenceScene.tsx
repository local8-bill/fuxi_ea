"use client";

import { Button } from "@/components/ui/button";
import { usePerformanceTracker } from "@/hooks/usePerformanceTracker";
import { useSceneManager, useSceneTelemetry } from "@/lib/scene";

const phases = ["FY26", "FY27", "FY28"];

export function SequenceScene() {
  const setScene = useSceneManager((state) => state.setScene);
  usePerformanceTracker("SequenceScene");
  useSceneTelemetry("sequence");

  return (
    <div className="grid gap-4 grid-cols-[240px_minmax(0,1fr)_240px] text-white">
      <aside className="rounded-2xl border border-white/10 bg-[#1b1b2c] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Phases</p>
        <div className="mt-3 space-y-2">
          {phases.map((phase) => (
            <button key={phase} className="w-full rounded-lg border border-white/15 px-3 py-2 text-left hover:bg-white/10">
              {phase}
            </button>
          ))}
        </div>
      </aside>
      <section className="rounded-2xl border border-dashed border-white/15 bg-[#151522] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#a1a1aa]">Sequencer</p>
            <h2 className="text-2xl font-semibold">Modernization Timeline</h2>
            <p className="text-sm text-slate-300">Drag phases, evaluate ROI/TCC, stage integrations.</p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>Scenario: Baseline FY26</p>
            <p>Confidence: 72%</p>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-white/10 bg-[#111123] px-4 py-16 text-center text-slate-400">
          Sequencer canvas placeholder — visualize dependencies + ROI overlays.
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => setScene("roi", "evaluate_roi")}>Evaluate ROI/TCC</Button>
          <Button variant="outline" onClick={() => setScene("digitalTwin", "return_to_twin")}>
            Return to Twin
          </Button>
        </div>
      </section>
      <aside className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Insights</p>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-white/15 p-3">
            <p className="text-xs text-[#a1a1aa]">ROI delta</p>
            <p className="text-xl font-semibold text-emerald-300">+12%</p>
          </div>
          <div className="rounded-lg border border-white/15 p-3">
            <p className="text-xs text-[#a1a1aa]">Timeline impact</p>
            <p className="text-xl font-semibold text-sky-300">-2 mo</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setScene("roi", "evaluate_roi")}>
            Evaluate ROI/TCC
          </Button>
        </div>
      </aside>
    </div>
  );
}
