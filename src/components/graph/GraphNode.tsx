"use client";

import clsx from "clsx";
import type { NodeProps } from "reactflow";
import type { CSSProperties } from "react";
import type { GraphViewMode } from "@/hooks/useGraphTelemetry";
import { getDomainAccent } from "./graphDomainColors";
import { getRoiSignalColor, shouldPulseRoi } from "./graphSignals";

export type GraphNodeVariant = "domain" | "system";

export type GraphNodeData = {
  label: string;
  domain?: string;
  variant?: GraphNodeVariant;
  highlight?: boolean;
  dimmed?: boolean;
  scenario?: boolean;
  badges?: Array<{ label: string; tone?: "default" | "accent" | "warn" | "muted" }>;
  overlay?: boolean;
  integrationTotal?: number;
  hiddenCount?: number;
  metrics?: {
    roi?: number | null;
    tcc?: number | null;
    readiness?: number | null;
    integrations?: number | null;
    stage?: string | null;
  };
  viewMode: GraphViewMode;
  phaseLabel?: string | null;
  stageLabel?: string | null;
};

function formatMetric(viewMode: GraphViewMode, data?: GraphNodeData["metrics"], domain?: string) {
  if (!data) return null;
  if (viewMode === "roi" && typeof data.roi === "number") return `ROI · ${Math.round(data.roi)}%`;
  if (viewMode === "sequencer" && typeof data.stage === "string") return `Stage · ${data.stage}`;
  if (viewMode === "capabilities" && typeof data.readiness === "number") return `Readiness · ${Math.round(data.readiness)}%`;
  if (viewMode === "domain" && domain) return domain;
  return null;
}

function badgeTone(tone?: "default" | "accent" | "warn" | "muted") {
  switch (tone) {
    case "accent":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "warn":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "muted":
      return "border-neutral-200 bg-neutral-100 text-neutral-600";
    default:
      return "border-neutral-200 bg-white text-neutral-600";
  }
}

export function GraphNode({ data, selected }: NodeProps<GraphNodeData>) {
  if (data.variant === "domain") {
    const accent = getDomainAccent(data.domain);
    const overlayActive = Boolean(data.overlay);
    return (
      <div
        data-graph-node="domain"
        className={clsx(
          "h-full w-full rounded-2xl border border-slate-200 bg-white/95 p-4 text-left shadow-sm transition",
          data.dimmed && "opacity-50",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{data.label}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Domain</p>
          </div>
          {typeof data.hiddenCount === "number" && data.hiddenCount > 0 ? (
            <span className="rounded-full border border-slate-200 px-3 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              +{data.hiddenCount}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
            {overlayActive ? "Monitoring" : "Flows"} · {data.integrationTotal ?? 0}
          </span>
          {overlayActive ? <span className="text-emerald-600">Overlay active</span> : <span>Shell focus</span>}
        </div>
        <div className="mt-4 h-1 rounded-full" style={{ backgroundColor: accent }} />
      </div>
    );
  }

  const overlayActive = Boolean(data.overlay);
  const metric = formatMetric(data.viewMode, data.metrics, data.domain);
  const accent = getDomainAccent(data.domain);
  const roiColor = getRoiSignalColor({ roi: data.metrics?.roi ?? null, tcc: data.metrics?.tcc ?? null });
  const subtitleParts: string[] = [];
  if (data.phaseLabel) subtitleParts.push(data.phaseLabel.toUpperCase());
  if (data.stageLabel) subtitleParts.push(data.stageLabel);
  const subtitle = subtitleParts.length ? subtitleParts.join(" · ") : data.domain;
  const accentStyle: CSSProperties = { borderColor: accent };
  const selectionShadow =
    data.highlight || selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined;
  return (
    <div
      data-graph-node="system"
      className={clsx(
        "pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        overlayActive && (data.metrics?.integrations ?? 0) > 0 && "ring-1 ring-emerald-200/80",
        data.dimmed && "opacity-40",
      )}
      style={{ ...selectionShadow, ...accentStyle }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{data.label}</p>
          {subtitle ? <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">{subtitle}</p> : null}
        </div>
        {metric ? <span className="text-[0.7rem] font-semibold text-slate-600">{metric}</span> : null}
      </div>
      {overlayActive && typeof data.metrics?.integrations === "number" ? (
        <p className="mt-2 text-[0.6rem] uppercase tracking-[0.3em] text-emerald-600">
          Integrations · {data.metrics.integrations}
        </p>
      ) : null}
      {data.badges?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.badges.map((badge, idx) => (
            <span
              key={`${data.label}-badge-${idx}`}
              className={clsx("rounded-full border border-slate-200 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em]", badgeTone(badge.tone))}
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: roiColor }} aria-hidden />
    </div>
  );
}
