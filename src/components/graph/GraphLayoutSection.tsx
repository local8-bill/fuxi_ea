"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export const graphSectionLabelClass = "text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-neutral-500";

export function GraphControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div data-graph-panel className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-3 text-neutral-800 shadow-sm">
      <p className={graphSectionLabelClass}>{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export function GraphControlButton({
  active,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      data-graph-button={active ? "active" : "default"}
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-200",
        active ? "border-indigo-600 bg-indigo-600 text-white" : "border-neutral-200 bg-white text-neutral-800",
      )}
    >
      <p className="font-semibold">{label}</p>
      <p className={clsx("text-xs", active ? "text-white/80" : "text-neutral-500")}>{helper}</p>
    </button>
  );
}
