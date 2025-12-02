"use client";

import type { LivingNode } from "@/types/livingMap";

type Props = {
  node?: LivingNode | null;
};

export function NodeInsightPanel({ node }: Props) {
  if (!node) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-500">
        Select a system on the map to view AI readiness, opportunity, and disposition details.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{node.label}</div>
          <div className="text-xs text-slate-500">
            {node.domain || "Unassigned"} · {node.disposition || "n/a"}
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
          Integrations: {node.integrationCount ?? 0}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <Metric label="Health" value={node.health} suffix="%" />
        <Metric label="AI Readiness" value={node.aiReadiness} suffix="%" />
        <Metric label="Opportunity" value={node.opportunityScore} suffix="%" />
        <Metric label="ROI" value={node.roiScore} suffix="%" />
        <Metric label="Risk" value={node.riskScore} suffix="%" />
      </div>

      {node.owner && (
        <div className="mt-3 text-xs text-slate-600">
          Owner: <span className="font-semibold text-slate-800">{node.owner}</span>
        </div>
      )}

      {node.aiSummary && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {node.aiSummary}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value?: number; suffix?: string }) {
  if (value == null) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm text-slate-400">—</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">
        {Math.round(value)}
        {suffix}
      </div>
    </div>
  );
}
