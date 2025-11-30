"use client";

import React from "react";
import type { ConnectionSuggestion } from "@/domain/services/connectionInference";

type Props = {
  suggestion: ConnectionSuggestion;
  sourceLabel: string;
  targetLabel: string;
  onConfirm: () => void;
  onReject: (reason?: string) => void;
  onReasonChange: (text: string) => void;
  reason?: string;
};

export function ConnectionPanel({
  suggestion,
  sourceLabel,
  targetLabel,
  onConfirm,
  onReject,
  onReasonChange,
  reason,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">
            {sourceLabel} → {targetLabel}
          </div>
          <div className="text-xs text-slate-600">
            Confidence: {suggestion.confidence.toFixed(2)} · {suggestion.reason}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => onReject(reason)}
          >
            Reject
          </button>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs font-semibold text-slate-700">Rationale (optional)</label>
        <textarea
          value={reason ?? ""}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          rows={2}
          placeholder="Why confirm/reject? (feeds confidence model)"
        />
      </div>
    </div>
  );
}
