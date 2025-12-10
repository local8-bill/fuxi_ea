"use client";

import clsx from "clsx";
import type { NodeProps } from "reactflow";
import type { GraphViewMode } from "@/hooks/useGraphTelemetry";

export type GraphNodeVariant = "domain" | "system";

export type GraphNodeData = {
  label: string;
  domain?: string;
  variant?: GraphNodeVariant;
  highlight?: boolean;
  dimmed?: boolean;
  scenario?: boolean;
  badges?: Array<{ label: string; tone?: "default" | "accent" | "warn" | "muted" }>;
  metrics?: {
    roi?: number | null;
    readiness?: number | null;
    integrations?: number | null;
    stage?: string | null;
  };
  viewMode: GraphViewMode;
};

const domainPalette: Record<string, string> = {
  commerce: "from-amber-200 via-amber-100 to-amber-50",
  finance: "from-sky-200 via-sky-100 to-sky-50",
  operations: "from-emerald-200 via-emerald-100 to-emerald-50",
  data: "from-indigo-200 via-indigo-100 to-indigo-50",
  supply: "from-emerald-200 via-emerald-100 to-emerald-50",
  default: "from-slate-200 via-slate-100 to-slate-50",
};

function getDomainTint(domain?: string) {
  if (!domain) return domainPalette.default;
  const key = domain.toLowerCase();
  return domainPalette[key] ?? domainPalette.default;
}

function formatMetric(viewMode: GraphViewMode, data?: GraphNodeData["metrics"], domain?: string) {
  if (!data) return null;
  if (viewMode === "roi" && typeof data.roi === "number") return `ROI · ${Math.round(data.roi)}%`;
  if (viewMode === "sequencer" && typeof data.stage === "string") return `Stage · ${data.stage}`;
  if (viewMode === "capabilities" && typeof data.readiness === "number") return `Readiness · ${Math.round(data.readiness)}%`;
  if (viewMode === "domain" && domain) return domain;
  if (typeof data.integrations === "number") return `Integrations · ${data.integrations}`;
  return null;
}

function badgeTone(tone?: "default" | "accent" | "warn" | "muted") {
  switch (tone) {
    case "accent":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "warn":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "muted":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-white text-slate-600 border-slate-200";
  }
}

export function GraphNode({ data, selected }: NodeProps<GraphNodeData>) {
  if (data.variant === "domain") {
    const tint = getDomainTint(data.domain);
    return (
      <div className={clsx("h-full w-full rounded-[32px] border border-white/70 bg-gradient-to-b p-4 shadow-inner", tint, data.dimmed && "opacity-50")}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">{data.label}</p>
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">Domain</span>
        </div>
      </div>
    );
  }

  const metric = formatMetric(data.viewMode, data.metrics, data.domain);
  return (
    <div
      className={clsx(
        "pointer-events-auto rounded-2xl border bg-white/95 p-3 text-left shadow-sm transition",
        data.highlight && "ring-2 ring-emerald-400 shadow-lg",
        data.dimmed && "opacity-40",
        selected && "border-slate-900",
      )}
    >
      <p className="text-sm font-semibold text-slate-900">{data.label}</p>
      {data.domain ? <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{data.domain}</p> : null}
      {metric ? <p className="mt-2 text-[0.7rem] text-slate-600">{metric}</p> : null}
      {data.badges?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.badges.map((badge, idx) => (
            <span
              key={`${data.label}-badge-${idx}`}
              className={clsx("rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.25em]", badgeTone(badge.tone))}
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
