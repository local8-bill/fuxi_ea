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
  icon?: string;
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

function formatDelta(value?: number | null) {
  if (typeof value !== "number") return null;
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}%`;
}

export function GraphNode({ data, selected }: NodeProps<GraphNodeData>) {
  if (data.variant === "domain") {
    const accent = getDomainAccent(data.domain);
    const overlayActive = Boolean(data.overlay);
    return (
      <div
        data-graph-node="domain"
        data-font-version="v2"
        className={clsx("relative flex h-full w-full flex-col rounded-3xl border bg-white shadow-sm transition", data.dimmed && "opacity-60")}
        style={{ borderColor: accent }}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Flows</span>
          <span className="rounded-full border px-2 py-0.5 text-xs font-semibold text-slate-800" style={{ borderColor: accent }}>
            {data.integrationTotal ?? 0}
          </span>
        </div>
        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-slate-900">{data.label}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Harmonized cluster</p>
            </div>
            {typeof data.hiddenCount === "number" && data.hiddenCount > 0 ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600">
                +{data.hiddenCount}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {overlayActive ? "Monitoring" : "Tracking"} {data.integrationTotal ?? 0} {data.integrationTotal === 1 ? "flow" : "flows"} across this domain.
          </p>
        </div>
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
  const subtitle = subtitleParts.length ? subtitleParts.join(" · ") : null;
  const accentStyle: CSSProperties = { borderColor: accent };
  const selectionShadow = data.highlight || selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined;
  const integrationSummaryParts: string[] = [];
  if (typeof data.metrics?.integrations === "number") {
    integrationSummaryParts.push(`Integrations • ${data.metrics.integrations}`);
  }
  const roiDelta = formatDelta(data.metrics?.roi ?? null);
  if (roiDelta) {
    integrationSummaryParts.push(`ROI ${roiDelta}`);
  }
  const tccDelta = formatDelta(data.metrics?.tcc ?? null);
  if (tccDelta) {
    integrationSummaryParts.push(`TCC ${tccDelta}`);
  }
  const integrationSummary = integrationSummaryParts.join("   |   ");
  return (
    <div
      data-graph-node="system"
      data-font-version="v2"
      className={clsx(
        "pointer-events-auto overflow-hidden rounded-lg border bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50",
        overlayActive && (data.metrics?.integrations ?? 0) > 0 && "ring-1 ring-emerald-200/80",
        data.dimmed && "opacity-40",
      )}
      style={{ ...accentStyle, ...selectionShadow }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[15px] font-semibold leading-tight text-neutral-950">{data.label}</p>
            {subtitle ? <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{subtitle}</p> : null}
          </div>
          {metric ? <p className="text-sm font-semibold text-neutral-600">{metric}</p> : null}
        </div>
        {integrationSummary ? <p className="mt-2 text-xs text-slate-500">{integrationSummary}</p> : null}
        {data.badges?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.badges.map((badge, idx) => (
              <span
                key={`${data.label}-badge-${idx}`}
                className={clsx("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em]", badgeTone(badge.tone))}
              >
                {badge.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className={clsx("h-1 w-full", shouldPulseRoi(data.metrics?.roi) && "animate-roiPulse")} style={{ backgroundColor: roiColor }} aria-hidden />
    </div>
  );
}
