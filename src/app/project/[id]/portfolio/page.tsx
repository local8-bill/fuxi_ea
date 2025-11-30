"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import {
  buildPortfolioSignalsFromIntake,
  type ProjectIntake,
  type PortfolioSignals,
} from "@/domain/services/portfolioEngine";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useSimplificationMetrics } from "@/hooks/useSimplificationMetrics";
import { useAdaptiveUIState } from "@/hooks/useAdaptiveUIState";

function computeSimplificationScore(signals: PortfolioSignals | null): number {
  if (!signals) return 0.3;
  let score = 0.4;
  if (signals.goalSummary && signals.goalSummary !== "No primary portfolio goals captured yet.") {
    score += 0.25;
  }
  if (signals.suggestedThemes.length > 0) {
    score += 0.15;
  }
  if (signals.focusAreas.length > 0) {
    score += 0.1;
  }
  return Math.min(1, score);
}

function loadProjectIntakeFromLocalStorage(
  projectId: string,
): ProjectIntake | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`fuxi:intake:${projectId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      projectId,
      industry: parsed.industry ?? null,
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers : [],
      aggression: parsed.aggression ?? null,
      constraints: Array.isArray(parsed.constraints)
        ? parsed.constraints
        : [],
      untouchables: Array.isArray(parsed.untouchables)
        ? parsed.untouchables
        : [],
      notes: parsed.notes ?? null,
    };
  } catch (err) {
    console.error("[PORTFOLIO] Failed to load intake from localStorage", err);
    return null;
  }
}

export default function PortfolioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id ?? "unknown";
  const telemetry = useTelemetry("portfolio", { projectId });
  const { snapshot, setMetrics } = useSimplificationMetrics("portfolio");
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
  } = useAdaptiveUIState("portfolio", {
    initialContext: "We use intake signals to pre-seed scenarios.",
    initialCTA: "Open Scenario Studio",
    initialProgress: 0.3,
  });

  const [signals, setSignals] = useState<PortfolioSignals | null>(null);
  const [loaded, setLoaded] = useState(false);
  const simplificationScore = computeSimplificationScore(signals);
  const simplificationScoreNormalized = Math.min(
    1,
    Math.max(0, (snapshot?.metrics?.SSS ?? simplificationScore * 5) / 5),
  );
  const simplificationLabel =
    simplificationScoreNormalized >= 0.8
      ? "Ready to compare"
      : simplificationScoreNormalized >= 0.5
      ? "Mostly aligned"
      : "Needs intake";
  const simplificationTone =
    simplificationScoreNormalized >= 0.8
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : simplificationScoreNormalized >= 0.5
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  const portfolioViewLoggedRef = useRef(false);
  const scenarioLoggedRef = useRef(false);

  useEffect(() => {
    const intake = loadProjectIntakeFromLocalStorage(projectId);
    const nextSignals = buildPortfolioSignalsFromIntake(intake);
    setSignals(nextSignals);
    setLoaded(true);
    if (!portfolioViewLoggedRef.current) {
      portfolioViewLoggedRef.current = true;
      telemetry.log("portfolio_view", { hasIntake: !!intake }, simplificationScoreNormalized);
    }
  }, [projectId, telemetry, simplificationScoreNormalized]);

  useEffect(() => {
    if (!signals) return;
    telemetry.log("portfolio_signals_ready", {
      hasGoals: signals.goalSummary !== "No primary portfolio goals captured yet.",
      goals: signals.goalSummary,
    }, simplificationScoreNormalized);
  }, [signals, telemetry, simplificationScoreNormalized]);

  const hasIntake =
    !!signals &&
    signals.goalSummary !== "No primary portfolio goals captured yet.";

  useEffect(() => {
    if (!hasIntake || scenarioLoggedRef.current) return;
    scenarioLoggedRef.current = true;
    telemetry.log(
      "scenario_compare_view",
      { projectId, hasIntake },
      simplificationScoreNormalized,
    );
  }, [hasIntake, projectId, telemetry, simplificationScoreNormalized]);

  useEffect(() => {
    setMetrics({
      DC: hasIntake ? 0.7 : 0.5,
      CL: hasIntake ? 0.55 : 0.7,
    });
  }, [hasIntake, setMetrics]);

  useEffect(() => {
    const nextProgress = !loaded ? 0.2 : hasIntake ? 0.8 : 0.45;
    setProgress(nextProgress);
    setCtaEnabled(hasIntake);
    setContextMessage(
      hasIntake
        ? "Signals loaded — compare scenarios or jump into Scenario Studio."
        : loaded
        ? "Add intake detail to unlock scenario comparisons."
        : "Loading intake context for this portfolio.",
    );
    setCtaLabel(hasIntake ? "Open Scenario Studio" : "Waiting on intake");

    if (!hasIntake && loaded) {
      setAssistVisible(true);
      setAssistMessage(
        "Capture intake goals to turn on comparisons and portfolio guidance.",
      );
    } else {
      setAssistVisible(false);
      setAssistMessage(null);
    }
  }, [
    hasIntake,
    loaded,
    setAssistMessage,
    setAssistVisible,
    setContextMessage,
    setCtaEnabled,
    setCtaLabel,
    setProgress,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAssistVisible(true);
      setAssistMessage(
        hasIntake
          ? "Adjust the scenario slider or jump into Scenario Studio to compare."
          : "Complete intake to unlock scenario comparisons.",
      );
      telemetry.log(
        "portfolio_idle",
        { idle_ms: 45000, hasIntake },
        simplificationScoreNormalized,
      );
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [
    hasIntake,
    loaded,
    setAssistMessage,
    setAssistVisible,
    telemetry,
    simplificationScoreNormalized,
  ]);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="PORTFOLIO"
        title="Portfolio Optimizer"
        description="Turn your intake and tech stack insights into a portfolio-level game plan the business actually cares about."
      />
      {showContextBar && (
        <Card className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] text-slate-500 uppercase mb-1">
              CONTEXT
            </p>
            <p className="text-xs text-slate-700">
              {contextMessage || "Adaptive prompts will respond to readiness state."}
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
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.75rem] font-semibold ${simplificationTone}`}
            >
              {Math.round(simplificationScoreNormalized * 100)}% · {simplificationLabel}
            </span>
            <button
              type="button"
              disabled={!ctaEnabled}
              onClick={() => {
                telemetry.log(
                  "portfolio_cta",
                  { projectId, target: "scenario_studio" },
                  simplificationScoreNormalized,
                );
                router.push(`/project/${projectId}/scenario-studio`);
              }}
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

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] text-slate-500">Readiness</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[0.75rem] font-semibold text-slate-700">
            {Math.round(simplificationScoreNormalized * 100)}% · {simplificationLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[0.7rem] text-slate-500">
          <span>Scenario slider (mock)</span>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={50}
            onChange={(e) => {
              const value = Number(e.target.value);
              telemetry.log(
                "portfolio_scenario_slider",
                { value },
                simplificationScoreNormalized,
              );
              telemetry.log(
                "simulation_complete",
                { value, projectId },
                simplificationScoreNormalized,
              );
            }}
            className="h-1 w-32 accent-slate-900"
          />
        </div>
      </Card>

      {/* Top nav / context */}
      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">
            PROJECT
          </p>
          <p className="text-xs text-gray-500">
            Optimizing portfolio moves for project{" "}
            <span className="font-medium">{projectId}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/project/${projectId}/intake`)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Intake
          </button>
          <button
            type="button"
            onClick={() => router.push(`/project/${projectId}/tech-stack`)}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Tech Stack
          </button>
        </div>
      </Card>

      {/* If no intake yet, nudge them there */}
      {!loaded && (
        <Card>
          <p className="text-sm text-slate-500">
            Loading portfolio signals from intake…
          </p>
        </Card>
      )}

      {loaded && !hasIntake && (
        <Card>
          <p className="text-sm text-slate-500 mb-2">
            No intake signals found for this project yet.
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Start with the intake questions so Fuxi can shape a portfolio view
            that reflects your industry, goals, appetite for change, and
            untouchable platforms.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/project/${projectId}/intake`)}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Go to Intake
          </button>
        </Card>
      )}

      {loaded && signals && hasIntake && (
        <>
          {/* Top 3 signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
                PORTFOLIO GOAL
              </p>
              <p className="text-sm text-slate-800">
                {signals.goalSummary}
              </p>
            </Card>

            <Card>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
                CHANGE POSTURE
              </p>
              <p className="text-sm text-slate-800">
                {signals.changePosture}
              </p>
            </Card>

            <Card>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
                THEMES
              </p>
              {signals.suggestedThemes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No clear themes yet — adjust intake drivers to sharpen how
                  we talk about this portfolio.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {signals.suggestedThemes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-0.5 text-[0.7rem] font-medium text-white"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Focus vs Guardrails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
                WHERE TO FOCUS
              </p>
              {signals.focusAreas.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Capture more detail in intake to highlight portfolio focus
                  areas.
                </p>
              ) : (
                <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1.5">
                  {signals.focusAreas.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
                GUARDRAILS
              </p>
              {signals.guardrails.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No explicit guardrails captured — validate with leadership
                  before committing to aggressive moves.
                </p>
              ) : (
                <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1.5">
                  {signals.guardrails.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Commentary / talking points */}
          <Card>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
              TALK TRACK FOR LEADERSHIP
            </p>
            {signals.commentary.length === 0 ? (
              <p className="text-sm text-slate-500">
                As you refine intake, this section will turn into a set of
                talking points you can use directly with executives.
              </p>
            ) : (
              <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1.5">
                {signals.commentary.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </Card>

          <p className="mt-3 text-[0.7rem] text-slate-400">
            This view is driven entirely from your intake answers — tech stack,
            Truth Pass, and financials will plug in next to shape specific
            moves.
          </p>
        </>
      )}
    </div>
  );
}
