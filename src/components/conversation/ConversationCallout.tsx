"use client";

import type { ReactNode } from "react";

interface ConversationAction {
  label: string;
  description?: string;
  onSelect?: () => void;
}

interface ConversationCalloutProps {
  title: string;
  summary: string;
  context?: string;
  reasons?: string[];
  actions?: ConversationAction[];
  footer?: ReactNode;
}

export function ConversationCallout({ title, summary, context, reasons, actions, footer }: ConversationCalloutProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-900/90 text-white shadow-lg shadow-slate-900/20">
      <div className="space-y-3 border-b border-white/10 px-5 py-4">
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-300">Fuxi · Conversational Briefing</p>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-200">{summary}</p>
        {context ? <p className="text-xs text-slate-300">{context}</p> : null}
        {reasons && reasons.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-200">
            {reasons.map((reason, idx) => (
              <li key={`${reason}-${idx}`}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>
      {(actions?.length ?? 0) > 0 ? (
        <div className="divide-y divide-white/5">
          {actions?.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onSelect}
              className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left text-sm transition hover:bg-white/5"
            >
              <div>
                <p className="font-semibold">{action.label}</p>
                {action.description ? <p className="text-xs text-slate-300">{action.description}</p> : null}
              </div>
              <span aria-hidden className="text-xs text-slate-400">
                →
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {footer ? <div className="border-t border-white/5 px-5 py-3 text-xs text-slate-300">{footer}</div> : null}
    </div>
  );
}
