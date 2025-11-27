"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import {
  buildPortfolioSignalsFromIntake,
  type ProjectIntake,
  type PortfolioSignals,
} from "@/domain/services/portfolioEngine";
import { useTelemetry } from "@/hooks/useTelemetry";

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

  const [signals, setSignals] = useState<PortfolioSignals | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const intake = loadProjectIntakeFromLocalStorage(projectId);
    const nextSignals = buildPortfolioSignalsFromIntake(intake);
    setSignals(nextSignals);
    setLoaded(true);
    telemetry.log("portfolio_view", { hasIntake: !!intake });
  }, [projectId]);

  useEffect(() => {
    if (!signals) return;
    telemetry.log("portfolio_signals_ready", {
      hasGoals: signals.goalSummary !== "No primary portfolio goals captured yet.",
      goals: signals.goalSummary,
    });
  }, [signals, telemetry]);

  const hasIntake =
    !!signals &&
    signals.goalSummary !== "No primary portfolio goals captured yet.";

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="PORTFOLIO"
        title="Portfolio Optimizer"
        description="Turn your intake and tech stack insights into a portfolio-level game plan the business actually cares about."
      />

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
