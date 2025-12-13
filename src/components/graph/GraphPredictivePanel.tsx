"use client";

import type { PredictiveScenario } from "@/hooks/usePredictiveScenarios";
import { riskState } from "./GraphSimulationControls";

interface Props {
  scenarios: PredictiveScenario[];
  selectedScenarioId?: string | null;
  onSelect: (scenario: PredictiveScenario) => void;
  onActivate: (scenario: PredictiveScenario) => void;
}

export function GraphPredictivePanel({ scenarios, selectedScenarioId, onSelect, onActivate }: Props) {
  if (!scenarios.length) return null;
  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Predictive Sequencer</p>
      <p className="text-xs text-neutral-500">ALE-simulated scenarios based on current sequencing.</p>
      <div className="mt-3 space-y-2">
        {scenarios.map((scenario) => {
          const active = selectedScenarioId === scenario.id;
          const roiDeltaPct = (scenario.roiDelta * 100).toFixed(1);
          const tccDelta = scenario.tccDelta;
          const risk = riskState(1 - scenario.confidence / 2);
          return (
            <div
              key={scenario.id}
              className={`rounded-2xl border px-3 py-2 text-sm shadow-sm transition ${
                active ? "border-indigo-500 bg-indigo-50" : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-neutral-900">{scenario.title}</p>
                  <p className="text-xs text-neutral-500">{scenario.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onActivate(scenario)}
                  className="rounded-full bg-neutral-900 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Apply
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[0.7rem] text-neutral-600">
                <Metric label="Confidence" value={`${Math.round(scenario.confidence * 100)}%`} />
                <Metric label="ROI delta" value={`${roiDeltaPct}%`} tone={scenario.roiDelta >= 0 ? "pos" : "neg"} />
                <Metric label="TCC delta" value={`${tccDelta >= 0 ? "+" : ""}${tccDelta.toFixed(1)}M`} tone={tccDelta <= 0 ? "pos" : "neg"} />
                <Metric label="Timeline" value={`${scenario.timelineDeltaMonths >= 0 ? "+" : ""}${scenario.timelineDeltaMonths} mo`} />
                <Metric label="ALE risk" value={risk.label} tone={risk.className.includes("rose") ? "neg" : "pos"} />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => onSelect(scenario)}
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-600"
                >
                  {active ? "Scenario selected" : "Preview"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-rose-600" : "text-neutral-600";
  return (
    <div>
      <p className="text-[0.55rem] uppercase tracking-[0.35em] text-neutral-400">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
