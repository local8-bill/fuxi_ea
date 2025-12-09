"use client";

import clsx from "clsx";
import type { LearningSnapshot } from "@/hooks/useLearningSnapshot";

type AdaptiveSignalsPanelProps = {
  snapshot: LearningSnapshot | null | undefined;
  title?: string;
  subtitle?: string;
  className?: string;
  hideWhenEmpty?: boolean;
  emptyMessage?: string;
};

export function AdaptiveSignalsPanel({
  snapshot,
  title = "Adaptive Signals",
  subtitle,
  className,
  hideWhenEmpty = false,
  emptyMessage = "Adaptive engine is calibrating. Trigger sequencing or ROI activity to generate signals.",
}: AdaptiveSignalsPanelProps) {
  const hasMetrics = Boolean(snapshot?.metrics);
  if (!hasMetrics && hideWhenEmpty) return null;

  const confidence = snapshot?.metrics?.confidence ?? 0;
  const velocity = snapshot?.metrics?.velocity ?? 0;
  const risk = snapshot?.metrics?.risk ?? 0;
  const maturity = snapshot?.metrics?.maturity ?? 0;

  return (
    <div className={clsx("rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[12px] text-slate-700", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</p>
        {subtitle ? <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{subtitle}</p> : null}
      </div>
      {hasMetrics ? (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Signal label="Confidence" value={confidence} accent="text-slate-900" />
            <Signal label="Velocity" value={velocity} accent="text-slate-900" />
            <Signal label="Risk" value={risk} accent="text-amber-700" />
            <Signal label="Maturity" value={maturity} accent="text-emerald-700" />
          </div>
          {snapshot?.narrative ? <p className="mt-2 text-[11px] text-slate-600">{snapshot.narrative}</p> : null}
        </>
      ) : (
        <p className="mt-2 text-[11px] text-slate-600">{emptyMessage}</p>
      )}
    </div>
  );
}

function Signal({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={clsx("text-sm font-semibold", accent)}>{Math.round(value * 100)}%</p>
    </div>
  );
}
