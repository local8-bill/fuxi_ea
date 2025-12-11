"use client";

import clsx from "clsx";

export type TransitionPath = {
  id: string;
  label: string;
  description: string;
  roi: number;
  tcc: number;
  confidence: number;
  throwaway: string;
  notes?: string;
};

export function GraphTransitionCompare({
  paths,
  activePathId,
  onSelect,
}: {
  paths: TransitionPath[];
  activePathId: string | null;
  onSelect: (path: TransitionPath) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Transition Paths</p>
      <p className="text-sm text-slate-600">Compare sequencing options for OMS modernization.</p>
      <div className="mt-3 space-y-3">
        {paths.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => onSelect(path)}
            className={clsx(
              "w-full rounded-2xl border px-3 py-2 text-left text-sm shadow-sm transition",
              activePathId === path.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-900",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{path.label}</p>
              <p className="text-xs text-slate-500">Confidence {(path.confidence * 100).toFixed(0)}%</p>
            </div>
            <p className="text-xs text-slate-600">{path.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] text-slate-600">
              <span className="rounded-full border border-slate-200 px-2 py-0.5">ROI {(path.roi * 100).toFixed(0)}%</span>
              <span className="rounded-full border border-slate-200 px-2 py-0.5">TCC ${path.tcc.toFixed(1)}M</span>
              <span className="rounded-full border border-slate-200 px-2 py-0.5">Throwaway {path.throwaway}</span>
            </div>
            {path.notes ? <p className="mt-2 text-[0.7rem] text-slate-500">{path.notes}</p> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
