"use client";
import type { Weights } from "@/domain/services/scoring";

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number; // 0..1
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-70">{pct}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
        className="w-full"
      />
    </div>
  );
}

export function WeightsDrawer({
  open,
  onClose,
  weights,
  setWeights,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  weights: Weights;
  setWeights: (w: Weights) => void;
  defaults: Weights;
}) {
  if (!open) return null;

  const total =
    weights.opportunity +
    weights.maturity +
    weights.techFit +
    weights.strategicAlignment +
    weights.peopleReadiness;

  const set = (patch: Partial<Weights>) => setWeights({ ...weights, ...patch });

  return (
    <>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} style={{ zIndex: 50 }} />
      <aside
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-5 overflow-y-auto"
        style={{ zIndex: 51 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="text-xl font-semibold">Weights</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="text-xs opacity-70 mb-3">
          Adjust how each factor contributes to the composite. We normalize automatically.
        </div>

        <Row label="Opportunity" value={weights.opportunity} onChange={(v) => set({ opportunity: v })} />
        <Row label="Maturity" value={weights.maturity} onChange={(v) => set({ maturity: v })} />
        <Row label="Tech Fit" value={weights.techFit} onChange={(v) => set({ techFit: v })} />
        <Row
          label="Strategic Alignment"
          value={weights.strategicAlignment}
          onChange={(v) => set({ strategicAlignment: v })}
        />
        <Row
          label="People Readiness"
          value={weights.peopleReadiness}
          onChange={(v) => set({ peopleReadiness: v })}
        />

        <div className="mt-4 text-xs">
          <span className="opacity-70">Raw total (pre-normalize):</span>{" "}
          <span className="font-medium">{(total * 100).toFixed(0)}%</span>
        </div>

        <div className="mt-6 flex gap-2">
          <button className="btn" onClick={() => setWeights(defaults)}>Reset to defaults</button>
        </div>
      </aside>
    </>
  );
}