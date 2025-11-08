"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

/** Local types so we don't depend on other files */
type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};
type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};
type Cap = { id: string; name: string; domain?: string; scores?: Scores };

/** Safe defaults */
const DEFAULT_SCORES: Scores = {
  maturity: 2.5,
  techFit: 2.5,
  strategicAlignment: 2.5,
  peopleReadiness: 2.5,
  opportunity: 2.5,
};

/** Local composite calc (weights can be any proportions) -> 0..1 */
function compositeScoreLocal(s: Scores, w: Weights) {
  const totalW =
    w.opportunity +
    w.maturity +
    w.techFit +
    w.strategicAlignment +
    w.peopleReadiness || 1;
  const n = (k: keyof Scores) => (s[k] ?? 0) / 5; // scale 0–5 to 0–1
  const val =
    (n("opportunity") * w.opportunity +
      n("maturity") * w.maturity +
      n("techFit") * w.techFit +
      n("strategicAlignment") * w.strategicAlignment +
      n("peopleReadiness") * w.peopleReadiness) /
    totalW;
  return Math.max(0, Math.min(1, val));
}

export function ScoringDrawer({
  open,
  onClose,
  cap,
  weights,
  onChangeScore,
}: {
  open: boolean;
  onClose: () => void;
  cap: Cap | null;
  weights: Weights;
  onChangeScore: (key: keyof Scores, val: number) => void;
}) {
  // Always have something to render (prevents blank sheet)
  const s: Scores = { ...DEFAULT_SCORES, ...(cap?.scores ?? {}) };
  const comp = compositeScoreLocal(s, weights);

  const Slider = ({ label, k }: { label: string; k: keyof Scores }) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-700">{label}</span>
      <input
        type="range"
        min={0}
        max={5}
        step={0.5}
        value={s[k]}
        onChange={(e) => onChangeScore(k, Number(e.target.value))}
        className="accent-blue-600"
      />
      <span className="text-[10px] text-gray-500">{s[k].toFixed(1)}</span>
    </label>
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[90vw] max-w-[520px] bg-white shadow-xl outline-none">
          {/* Accessible header */}
          <div className="border-b p-4">
            <Dialog.Title className="text-base font-semibold">
              {cap?.name ?? "Capability Scoring"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-gray-600">
              {cap?.domain ? cap.domain : "Adjust capability scoring metrics."}
            </Dialog.Description>
            <div className="mt-2 text-xs text-gray-700">
              Composite: <span className="font-medium">{Math.round(comp * 100)}/100</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {!cap ? (
              <div className="text-sm text-gray-600">
                No capability selected.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Slider label="Opportunity" k="opportunity" />
                  <Slider label="Maturity" k="maturity" />
                  <Slider label="Tech Fit" k="techFit" />
                  <Slider label="Strategic Alignment" k="strategicAlignment" />
                  <Slider label="People Readiness" k="peopleReadiness" />
                </div>
                <p className="text-xs text-gray-500">
                  Changes save instantly. Close this panel when done.
                </p>
              </>
            )}
          </div>

          <div className="border-t p-4">
            <Dialog.Close asChild>
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ScoringDrawer;