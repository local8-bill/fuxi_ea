"use client";

import type { ReactNode } from "react";
import { Icons } from "@/components/ui/icons";

interface AgentPreviewCardProps {
  title: string;
  summary: string;
  ctaLabel: string;
  icon?: ReactNode;
  onAccept?: () => void;
  onDismiss?: () => void;
}

export function AgentPreviewCard({ title, summary, ctaLabel, icon, onAccept, onDismiss }: AgentPreviewCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md shadow-slate-900/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Next up</p>
          <div className="mt-1 flex items-center gap-2">
            {icon ? <span className="text-emerald-500">{icon}</span> : null}
            <p className="text-base font-semibold text-slate-900">{title}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss preview"
          onClick={onDismiss}
          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Icons.close className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600">{summary}</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
