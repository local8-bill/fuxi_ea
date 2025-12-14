"use client";

import { Button } from "@/components/ui/Button";
import { usePerformanceTracker } from "@/hooks/usePerformanceTracker";
import { useSceneManager, useSceneTelemetry } from "@/lib/scene";

export function DigitalTwinScene() {
  const setScene = useSceneManager((state) => state.setScene);
  usePerformanceTracker("DigitalTwinScene");
  useSceneTelemetry("digitalTwin");

  return (
    <div className="grid gap-4 grid-cols-[240px_minmax(0,1fr)_240px]">
      <aside className="rounded-2xl border border-white/10 bg-[#1b1b2c] p-4 text-sm text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Focus Rail</p>
        <div className="mt-3 space-y-2">
          {["Systems", "Domains", "Sequencer Lens", "Capability View"].map((item) => (
            <button key={item} className="w-full rounded-lg border border-white/15 px-3 py-2 text-left transition hover:bg-white/10">
              {item}
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-dashed border-white/15 bg-[#151522] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#a1a1aa]">Digital Twin</p>
            <h2 className="text-2xl font-semibold">Enterprise OMS Transformation Graph</h2>
            <p className="text-sm text-slate-300">FY26–FY28 sequencing · ALE overlays · EAgent guidance</p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>Rails: Focus + Insight</p>
            <p>Overlay: Integrations Active</p>
          </div>
        </div>
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-[#111123] px-4 py-20 text-slate-400">
          Graph canvas placeholder — hydrate with ReactFlow in production.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setScene("sequence", "simulate_sequence")}>Simulate Sequence</Button>
          <Button variant="outline">Harmonize Stack</Button>
          <Button variant="outline">Add View</Button>
        </div>
      </section>

      <aside className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Next Actions</p>
        <div className="mt-3 space-y-2">
          <button
            className="w-full rounded-lg border border-white/20 px-3 py-2 text-left transition hover:bg-white/10"
            onClick={() => setScene("sequence", "simulate_sequence")}
          >
            Build Sequence ▸
          </button>
          <button className="w-full rounded-lg border border-white/20 px-3 py-2 text-left transition hover:bg-white/10">Harmonize Stack ▸</button>
          <button className="w-full rounded-lg border border-white/20 px-3 py-2 text-left transition hover:bg-white/10">Add View ▸</button>
        </div>
      </aside>
    </div>
  );
}
