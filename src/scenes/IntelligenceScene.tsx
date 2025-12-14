"use client";

import { Button } from "@/components/ui/Button";
import { usePerformanceTracker } from "@/hooks/usePerformanceTracker";
import { useSceneManager, useSceneTelemetry } from "@/lib/scene";

export function IntelligenceScene() {
  const setScene = useSceneManager((state) => state.setScene);
  usePerformanceTracker("IntelligenceScene");
  useSceneTelemetry("intelligence");

  const panels = [
    { title: "Org Insights", body: "Behavioral + structural trends captured from ALE reasoning." },
    { title: "Readiness Index", body: "FY26 readiness at 0.64 with positive telemetry momentum." },
    { title: "Action Items", body: "Lock FY27 sequence, schedule harmonization review." },
  ];

  return (
    <div className="space-y-4 text-white">
      <header className="rounded-2xl border border-white/10 bg-[#1b1b2c] p-4">
        <p className="text-xs uppercase tracking-[0.4em] text-[#a1a1aa]">Org Intelligence</p>
        <h2 className="text-2xl font-semibold">Insights & Recommendations</h2>
        <p className="text-sm text-slate-300">Fully client-side transitions — no graph reloads.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {panels.map((panel) => (
          <div key={panel.title} className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">{panel.title}</p>
            <p className="mt-2">{panel.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setScene("digitalTwin", "return_to_ecosystem")}>Return to Ecosystem View</Button>
        <Button variant="outline" onClick={() => setScene("sequence", "open_sequence_from_intel")}>
          Open Sequencer
        </Button>
      </div>
    </div>
  );
}
