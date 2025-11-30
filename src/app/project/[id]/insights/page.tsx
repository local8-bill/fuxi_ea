"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAdaptiveUIState } from "@/hooks/useAdaptiveUIState";
import { useSimplificationMetrics } from "@/hooks/useSimplificationMetrics";

type Insight = {
  id: string;
  title: string;
  impact: "Cost" | "Risk" | "Efficiency";
  summary: string;
};

const MOCK_INSIGHTS: Insight[] = [
  {
    id: "insight-1",
    title: "Reduce middleware overlap",
    impact: "Cost",
    summary:
      "Consolidate Boomi + MuleSoft connectors into a single integration lane to cut run-rate and support effort.",
  },
  {
    id: "insight-2",
    title: "Stabilize PIM dependencies",
    impact: "Risk",
    summary:
      "High coupling between PIM and storefront indicates fragility during catalog updates; introduce async buffering.",
  },
  {
    id: "insight-3",
    title: "Modernize reporting stack",
    impact: "Efficiency",
    summary:
      "Adopt a single BI path (Snowflake + Looker) to reduce redundant dashboards and improve data trust.",
  },
];

export default function InsightsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "unknown";
  const telemetry = useTelemetry("insights", { projectId });
  const { snapshot, setMetrics } = useSimplificationMetrics("insights");
  const {
    showContextBar,
    contextMessage,
    setContextMessage,
    assistVisible,
    assistMessage,
    setAssistMessage,
    setAssistVisible,
    ctaEnabled,
    setCtaEnabled,
    ctaLabel,
    setCtaLabel,
    progress,
    setProgress,
  } = useAdaptiveUIState("insights", {
    initialContext: "Review insights grouped by impact. Export once you’ve opened one.",
    initialCTA: "Export insights",
    initialProgress: 0.25,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState(false);
  const idleTimer = useRef<number | null>(null);

  const simplificationScore = useMemo(() => {
    const sss = snapshot?.metrics?.SSS ?? 2.0;
    const normalized = Math.min(1, Math.max(0, sss / 5));
    return normalized;
  }, [snapshot]);

  const simplificationLabel =
    simplificationScore >= 0.8
      ? "Clean insights"
      : simplificationScore >= 0.5
      ? "Mostly aligned"
      : "Needs focus";
  const simplificationTone =
    simplificationScore >= 0.8
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : simplificationScore >= 0.5
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  useEffect(() => {
    telemetry.log("insights_view", { projectId }, simplificationScore);
  }, [projectId, telemetry, simplificationScore]);

  useEffect(() => {
    const openedCount = expanded.size;
    const nextProgress = openedCount > 0 ? 0.75 : 0.4;
    setProgress(nextProgress);
    setCtaEnabled(openedCount > 0);
    setContextMessage(
      openedCount > 0
        ? "Insights reviewed — export a summary to capture this run."
        : "Open at least one insight to enable export.",
    );
    setCtaLabel(openedCount > 0 ? "Export insights" : "Open an insight to export");
  }, [
    expanded.size,
    setContextMessage,
    setCtaEnabled,
    setCtaLabel,
    setProgress,
  ]);

  useEffect(() => {
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
    }
    idleTimer.current = window.setTimeout(() => {
      setAssistVisible(true);
      setAssistMessage("Need a quick summary? Open an insight and export to share.");
      telemetry.log("insights_idle", { idle_ms: 45000 }, simplificationScore);
    }, 45000);

    return () => {
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, [expanded, setAssistMessage, setAssistVisible, telemetry, simplificationScore]);

  const toggleInsight = (insight: Insight) => {
    setAssistVisible(false);
    setAssistMessage(null);
    setExported(false);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(insight.id)) {
        next.delete(insight.id);
      } else {
        next.add(insight.id);
      }
      return next;
    });
    telemetry.log(
      "insight_toggle",
      { id: insight.id, impact: insight.impact, expanded: !expanded.has(insight.id) },
      simplificationScore,
    );
  };

  const handleExport = () => {
    setExported(true);
    telemetry.log(
      "insight_export_complete",
      { projectId, opened: Array.from(expanded) },
      simplificationScore,
    );
  };

  // Simple slider to nudge the simplification stub for color feedback
  const handleClarityChange = (value: number) => {
    setMetrics({ DC: value });
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="INSIGHTS"
        title="Outcome Summaries"
        description="Review prioritized insights grouped by impact and export a quick summary once you've opened at least one."
      />

      {showContextBar && (
        <Card className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] text-slate-500 uppercase mb-1">
              CONTEXT
            </p>
            <p className="text-xs text-slate-700">
              {contextMessage || "Adaptive guidance will respond as you interact."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-2 w-36 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[0.75rem] font-semibold text-slate-800">
              {Math.round(progress * 100)}%
            </span>
            <button
              type="button"
              disabled={!ctaEnabled}
              onClick={handleExport}
              className={
                "rounded-full px-4 py-1.5 text-[0.75rem] font-semibold " +
                (ctaEnabled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed")
              }
            >
              {ctaLabel}
            </button>
          </div>
        </Card>
      )}

      {assistVisible && assistMessage && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-[0.65rem] tracking-[0.22em] text-amber-700 uppercase mb-1">
            NEXT STEP
          </p>
          <p className="text-xs text-amber-800">{assistMessage}</p>
        </Card>
      )}

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-slate-600">Simplification</span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.75rem] font-semibold ${simplificationTone}`}
          >
            {Math.round(simplificationScore * 100)}% · {simplificationLabel}
          </span>
        </div>
        <label className="flex items-center gap-2 text-[0.75rem] text-slate-600">
          Clarity stub
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            defaultValue={0.68}
            onChange={(e) => handleClarityChange(Number(e.target.value))}
            className="h-1 w-32 accent-slate-900"
          />
        </label>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_INSIGHTS.map((insight) => {
          const isOpen = expanded.has(insight.id);
          return (
            <Card
              key={insight.id}
              className={
                "cursor-pointer transition-colors " +
                (isOpen ? "border-slate-900" : "border-slate-200")
              }
              onClick={() => toggleInsight(insight)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] tracking-[0.22em] text-gray-500 uppercase mb-1">
                    {insight.impact}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {insight.title}
                  </p>
                </div>
                <span className="text-[0.75rem] text-slate-500">
                  {isOpen ? "Hide" : "Open"}
                </span>
              </div>
              {isOpen && (
                <p className="mt-2 text-sm text-slate-700">{insight.summary}</p>
              )}
            </Card>
          );
        })}
      </div>

      {exported && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <p className="text-[0.65rem] tracking-[0.22em] text-emerald-700 uppercase mb-1">
            EXPORT READY
          </p>
          <p className="text-xs text-emerald-800">
            Insight export event logged. Keep refining to improve Simplification Score.
          </p>
        </Card>
      )}
    </div>
  );
}
