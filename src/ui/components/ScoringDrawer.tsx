"use client";
import { compositeScore, type Weights } from "@/domain/services/scoring";
import type { Capability, Scores } from "@/domain/model/capability";

function LabeledSlider({
  label, value01, onChange,
}: { label: string; value01: number; onChange: (v01: number) => void }) {
  const v = Math.round((value01 ?? 0) * 100);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-70">{v}/100</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => onChange(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
        className="w-full"
      />
    </div>
  );
}

export function ScoringDrawer({
  open,
  onClose,
  cap,
  weights,
  onPatch,
}: {
  open: boolean;
  onClose: () => void;
  cap: Capability | null;
  weights: Weights;
  onPatch: (patch: Partial<Scores>) => void;
}) {
  if (!open || !cap) return null;
  const s = cap.scores ?? {};
  const composite = Math.round(compositeScore(s, weights) * 100);

  return (
    <>
      {/* dimmer */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        style={{ zIndex: 50 }}
      />
      {/* panel */}
      <aside
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-5 overflow-y-auto"
        style={{ zIndex: 51 }}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xl font-semibold">{cap.name}</div>
            <div className="text-xs opacity-70">{cap.domain ?? "Unassigned"}</div>
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="badge mb-4">Composite: {composite}/100</div>

        <LabeledSlider
          label="Opportunity"
          value01={s.opportunity ?? 0}
          onChange={(v) => onPatch({ opportunity: v })}
        />
        <LabeledSlider
          label="Maturity"
          value01={s.maturity ?? 0}
          onChange={(v) => onPatch({ maturity: v })}
        />
        <LabeledSlider
          label="Tech Fit"
          value01={s.techFit ?? 0}
          onChange={(v) => onPatch({ techFit: v })}
        />
        <LabeledSlider
          label="Strategic Alignment"
          value01={s.strategicAlignment ?? 0}
          onChange={(v) => onPatch({ strategicAlignment: v })}
        />
        <LabeledSlider
          label="People Readiness"
          value01={s.peopleReadiness ?? 0}
          onChange={(v) => onPatch({ peopleReadiness: v })}
        />
      </aside>
    </>
  );
}