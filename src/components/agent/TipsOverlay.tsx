"use client";

type Tip = {
  title: string;
  detail: string;
};

const defaultTips: Tip[] = [
  {
    title: "Command Deck",
    detail: "Start here to resume context, run `/mode` commands, or ask the agent what’s next.",
  },
  {
    title: "Digital Twin",
    detail: "Explore the harmonized enterprise map. Hover nodes to see dependencies and scenario hints.",
  },
  {
    title: "ROI Dashboard",
    detail: "Quantify TCC and ROI per wave. Sequencer changes update this view automatically.",
  },
  {
    title: "Sequencer",
    detail: "Drag phases or use `/intent` to restage modernization waves in real time.",
  },
  {
    title: "Review",
    detail: "Validate harmonization deltas, approvals, and readiness before sharing.",
  },
];

export function TipsOverlay({ onClose, tips = defaultTips }: { onClose: () => void; tips?: Tip[] }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-3xl rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Guided Tips</p>
            <h2 className="text-2xl font-semibold text-slate-900">Where should we focus first?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Here are a few fast moves. You can reopen this at any time from the 💡 icon or by typing <code className="rounded bg-slate-100 px-1">/tips</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <ol className="mt-5 grid gap-4 md:grid-cols-2">
          {tips.map((tip) => (
            <li key={tip.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{tip.title}</p>
              <p className="mt-1 text-sm text-slate-600">{tip.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>Need a tour? Type <code className="rounded bg-white/80 px-1">/mode demo</code> or ping the agent.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Let’s get started
          </button>
        </div>
      </div>
    </div>
  );
}
