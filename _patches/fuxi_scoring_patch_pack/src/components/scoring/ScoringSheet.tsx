"use client";

import { useCapabilities, DEFAULT_SCORES } from "@/features/capabilities/CapabilityProvider";

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-700">{label}</div>
        <div className="rounded border bg-white px-1.5 py-0.5 text-xs">{value}</div>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded bg-gray-200"
      />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>1 • Emerging</span><span>3 • Established</span><span>5 • Leading</span>
      </div>
    </div>
  );
}

export function ScoringSheet() {
  const {
    openId, setOpenId, byId, children,
    effectiveScores, isOverridden,
    setOverrideEnabled, updateOverride, updateScore,
  } = useCapabilities();

  const cap = openId ? byId[openId] : null;
  const eff = openId ? effectiveScores(openId) : DEFAULT_SCORES;
  const overridden = openId ? isOverridden(openId) : false;

  if (!cap) return null;

  const close = () => setOpenId(null);

  const setDim = (key: keyof typeof eff, val: number) => {
    if (!openId) return;
    if (overridden) updateOverride(openId, key, val);
    else updateScore(openId, key, val);
  };

  const hasL3 = (children[cap.id] || []).length > 0;

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={close} />
      {/* panel */}
      <aside className="fixed right-0 top-0 z-50 h-full w-[92vw] max-w-[520px] overflow-auto border-l bg-white shadow-xl">
        <div className="border-b p-4">
          <div className="text-base font-semibold">{cap.name}</div>
          {cap.domain && <div className="mt-1 text-xs text-gray-500">{cap.domain}</div>}
        </div>

        <div className="space-y-5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Scoring</div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={overridden}
                onChange={(e) => setOverrideEnabled(cap.id, e.target.checked)}
              />
              Use override
            </label>
          </div>

          <ScoreSlider label="Opportunity" value={eff.opportunity} onChange={(v) => setDim("opportunity", v)} />
          <ScoreSlider label="Maturity" value={eff.maturity} onChange={(v) => setDim("maturity", v)} />
          <ScoreSlider label="Tech Fit" value={eff.techFit} onChange={(v) => setDim("techFit", v)} />
          <ScoreSlider label="Strategic Alignment" value={eff.strategicAlignment} onChange={(v) => setDim("strategicAlignment", v)} />
          <ScoreSlider label="People Readiness" value={eff.peopleReadiness} onChange={(v) => setDim("peopleReadiness", v)} />

          {cap.level === "L2" && hasL3 && !overridden && (
            <div className="rounded-lg border bg-gray-50 p-3 text-[13px] text-gray-700">
              This L2 score is <b>rolled up from its L3 children</b>. To enter a manual L2 score, enable “Use override”.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t bg-white p-3">
          <div className="flex items-center justify-end gap-2">
            <button onClick={close} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
