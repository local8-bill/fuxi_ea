"use client";

import { Button } from "@/components/ui/Button";
import { usePerformanceTracker } from "@/hooks/usePerformanceTracker";
import { useSceneManager, useSceneTelemetry } from "@/lib/scene";

export function RoiScene() {
  const setScene = useSceneManager((state) => state.setScene);
  usePerformanceTracker("RoiScene");
  useSceneTelemetry("roi");

  const cards = [
    { label: "ROI", value: "72%", tone: "text-emerald-300" },
    { label: "TCC Delta", value: "-$4.5M", tone: "text-sky-300" },
    { label: "Confidence", value: "0.82", tone: "text-indigo-300" },
  ];

  return (
    <div className="space-y-4 text-white">
      <header className="rounded-2xl border border-white/10 bg-[#1b1b2c] p-4">
        <p className="text-xs uppercase tracking-[0.4em] text-[#a1a1aa]">ROI / TCC Analysis</p>
        <h2 className="text-2xl font-semibold">Comparing FY26 vs Accelerate FY27</h2>
        <p className="text-sm text-slate-300">No reloads: data sourced directly from Sequencer dataset.</p>
      </header>
      <div className="grid gap-4 grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#151522] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Summary</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-white/15 bg-[#1f1f2f] p-4">
                <p className="text-xs text-[#a1a1aa]">{card.label}</p>
                <p className={`text-2xl font-semibold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-white/20 px-4 py-12 text-center text-slate-400">
            Chart placeholder — stacked bar chart for ROI/TCC comparison.
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Next Steps</p>
            <p className="mt-2 text-sm text-slate-300">Promote the scenario into Org Intelligence for executive review.</p>
            <Button className="mt-4 w-full" onClick={() => setScene("intelligence", "generate_intelligence")}>
              Generate Intelligence
            </Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Assumptions</p>
            <ul className="mt-2 space-y-2 list-disc pl-4">
              <li>Sequencer dataset: Accelerate FY27 (v3)</li>
              <li>Telemetry session preserved</li>
              <li>Digital Twin state cached for loopback</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
