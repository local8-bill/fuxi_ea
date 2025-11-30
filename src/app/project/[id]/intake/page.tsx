"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAdaptiveUIState } from "@/hooks/useAdaptiveUIState";
import { useSimplificationMetrics } from "@/hooks/useSimplificationMetrics";

type AggressionLevel = "conservative" | "balanced" | "bold";

interface ProjectIntake {
  projectId: string;
  industry: string | null;
  drivers: string[];
  aggression: AggressionLevel | null;
}

const INDUSTRIES: string[] = [
  "Retail / E-commerce",
  "Consumer / Footwear / Apparel",
  "Manufacturing / Supply Chain",
  "Financial Services",
  "Healthcare / Life Sciences",
  "Other",
];

const DRIVERS: string[] = [
  "Reduce tech / vendor sprawl",
  "Modernize customer experience",
  "Stabilize core platforms",
  "Accelerate data & analytics",
  "Prepare for M&A / divestiture",
  "Cost takeout (run-rate)",
];

const AGGRESSION_LEVELS: { id: AggressionLevel; label: string; description: string }[] = [
  {
    id: "conservative",
    label: "Conservative",
    description: "Smaller, safer moves. Minimize disruption to the business.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Mix of quick wins and structural change over the horizon.",
  },
  {
    id: "bold",
    label: "Bold",
    description: "Aggressive simplification and modernization, higher change tolerance.",
  },
];

export default function ProjectIntakePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const telemetry = useTelemetry("intake", { projectId: params?.id });
  const startedRef = useRef(false);
  const summaryLoggedRef = useRef(false);
  const { snapshot, setMetrics } = useSimplificationMetrics("intake");
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
    progress,
    setProgress,
  } = useAdaptiveUIState("intake", {
    initialContext: "Define objectives to unlock adaptive guidance across workspaces.",
    initialCTA: "Continue to Tech Stack",
    initialProgress: 0.2,
  });

  const projectId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "unknown";

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedAggression, setSelectedAggression] =
    useState<AggressionLevel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const prevMetricsRef = useRef<{ DC: number; CL: number }>({
    DC: snapshot?.metrics?.DC ?? 0.65,
    CL: snapshot?.metrics?.CL ?? 0.7,
  });

  function toggleDriver(driver: string) {
    startedRef.current = true;
    setSelectedDrivers((prev) =>
      prev.includes(driver)
        ? prev.filter((d) => d !== driver)
        : [...prev, driver],
    );
    telemetry.log("intake_driver_toggle", {
      driver,
      active: !selectedDrivers.includes(driver),
    });
  }

  function handleContinue() {
    const intake: ProjectIntake = {
      projectId,
      industry: selectedIndustry,
      drivers: selectedDrivers,
      aggression: selectedAggression,
    };

    fetch(`/api/intake/${encodeURIComponent(projectId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intake),
    }).catch((err) => {
      console.error("[INTAKE] Failed to persist intake context", err);
    });

    telemetry.log("intake_continue", {
      industry: selectedIndustry,
      drivers: selectedDrivers,
      aggression: selectedAggression,
    }, simplificationScore);
    router.push(`/project/${projectId}/tech-stack`);
  }

  const canContinue =
    !!selectedIndustry && selectedDrivers.length > 0 && !!selectedAggression;
  const completionRatio =
    (Number(!!selectedIndustry) +
      Number(selectedDrivers.length > 0) +
      Number(!!selectedAggression)) /
    3;
  const simplificationScore = Math.min(
    1,
    Math.max(0, (snapshot?.metrics?.SSS ?? 2.5) / 5),
  );
  const simplificationLabel =
    simplificationScore >= 0.8
      ? "Clean intake"
      : simplificationScore >= 0.5
      ? "Mostly aligned"
      : "Needs clarity";
  const simplificationTone =
    simplificationScore >= 0.8
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : simplificationScore >= 0.5
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  // Idle detection and gentle assist prompt
  useEffect(() => {
    if (!startedRef.current) return;
    setAssistVisible(false);
    setAssistMessage(null);
    const timer = window.setTimeout(() => {
      setAssistVisible(true);
      setAssistMessage("Need help clarifying your objectives?");
      telemetry.log("intake_idle", { idle_ms: 45000 }, simplificationScore);
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [
    selectedIndustry,
    selectedDrivers,
    selectedAggression,
    telemetry,
    setAssistVisible,
    setAssistMessage,
    simplificationScore,
  ]);

  const validationErrors = (() => {
    let count = 0;
    if (!selectedIndustry) count += 1;
    if (selectedDrivers.length === 0) count += 1;
    if (!selectedAggression) count += 1;
    return count;
  })();

  useEffect(() => {
    telemetry.log("intake_view", { projectId }, simplificationScore);
  }, [projectId, telemetry, simplificationScore]);

  // Adaptive context bar + CTA readiness
  useEffect(() => {
    setProgress(completionRatio || 0);
    setCtaEnabled(canContinue);
    setContextMessage(
      canContinue
        ? "Summary ready — move forward to Tech Stack with confidence."
        : "Capture industry, drivers, and posture to unlock the summary card.",
    );
    const nextMetrics = {
      DC: 0.65 + completionRatio * 0.25,
      CL: 0.7 - completionRatio * 0.3,
    };
    const dcDelta = Math.abs((prevMetricsRef.current?.DC ?? 0) - nextMetrics.DC);
    const clDelta = Math.abs((prevMetricsRef.current?.CL ?? 0) - nextMetrics.CL);
    if (dcDelta > 0.001 || clDelta > 0.001) {
      prevMetricsRef.current = nextMetrics;
      setMetrics(nextMetrics);
    }
    if (canContinue && !summaryLoggedRef.current) {
      summaryLoggedRef.current = true;
      telemetry.log(
        "intake_summary_view",
        { projectId },
        simplificationScore,
      );
    }
  }, [
    canContinue,
    completionRatio,
    setContextMessage,
    setCtaEnabled,
    setProgress,
    setMetrics,
    telemetry,
    projectId,
    simplificationScore,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadIntake() {
      try {
        const res = await fetch(`/api/intake/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Load failed ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json?.intake) {
          setSelectedIndustry(json.intake.industry ?? null);
          setSelectedDrivers(Array.isArray(json.intake.drivers) ? json.intake.drivers : []);
          setSelectedAggression(json.intake.aggression ?? null);
        }
        setLoadError(null);
      } catch (err: any) {
        if (!cancelled) {
          setLoadError("Failed to load saved intake. You can still proceed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadIntake();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <WorkspaceHeader
        statusLabel="INTAKE"
        title="Project Intake"
        description="Capture a few signals about your environment so Fuxi can tune how it interprets your tech stack and portfolio moves."
      />

      {showContextBar && (
        <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] text-slate-500 uppercase mb-1">
              CONTEXT
            </p>
            <p className="text-xs text-slate-700">
              {contextMessage || "Adaptive guidance will surface as you progress."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[0.75rem] font-semibold text-slate-800">
              {Math.round(progress * 100)}%
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold ${simplificationTone}`}
            >
              {Math.round(simplificationScore * 100)}% · {simplificationLabel}
            </span>
          </div>
        </Card>
      )}

      {assistVisible && assistMessage && (
        <Card className="mt-4 mb-4 border-amber-200 bg-amber-50">
          <p className="text-[0.65rem] tracking-[0.22em] text-amber-700 uppercase mb-1">
            ASSIST
          </p>
          <p className="text-xs text-amber-800">{assistMessage}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Industry */}
        <Card>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
            INDUSTRY
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Where does this business primarily operate?
          </p>
          <div className="space-y-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => {
                  startedRef.current = true;
                  setSelectedIndustry(ind);
                  telemetry.log("intake_industry_select", { industry: ind });
                }}
                className={
                  "w-full rounded-full border px-3 py-1.5 text-[0.75rem] text-left " +
                  (selectedIndustry === ind
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400")
                }
              >
                {ind}
              </button>
            ))}
          </div>
        </Card>

        {/* Drivers */}
        <Card>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
            STRATEGIC DRIVERS
          </p>
          <p className="text-xs text-gray-500 mb-4">
            What outcomes matter most for this roadmap?
          </p>
          <div className="flex flex-wrap gap-2">
            {DRIVERS.map((d) => {
              const active = selectedDrivers.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDriver(d)}
                  className={
                    "rounded-full border px-3 py-1 text-[0.7rem] " +
                    (active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400")
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Aggression */}
        <Card>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
            CHANGE AGGRESSION
          </p>
          <p className="text-xs text-gray-500 mb-4">
            How aggressive can we be with simplification and modernization?
          </p>
          <div className="space-y-2">
            {AGGRESSION_LEVELS.map((lvl) => {
              const active = selectedAggression === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    startedRef.current = true;
                    setSelectedAggression(lvl.id);
                    telemetry.log("intake_aggression_select", { level: lvl.id });
                  }}
                  className={
                    "w-full rounded-xl border px-3 py-2 text-left text-[0.75rem] " +
                    (active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400")
                  }
                >
                  <div className="font-semibold">{lvl.label}</div>
                  <div className="text-[0.7rem] opacity-80">
                    {lvl.description}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {startedRef.current && validationErrors > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <p className="text-[0.65rem] tracking-[0.22em] text-amber-700 uppercase mb-1">
            NEXT STEP
          </p>
          <p className="text-xs text-amber-800">
            {validationErrors > 2
              ? "Choose an industry, at least one driver, and your change posture to continue."
              : "Finish the remaining fields to summarize intake and move forward."}
          </p>
        </Card>
      )}

      {canContinue && (
        <Card className="mt-6">
          <p className="text-[0.65rem] tracking-[0.22em] text-gray-500 uppercase mb-1">
            SUMMARY
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Quick recap before proceeding. You can adjust these later.
          </p>
          <div className="text-sm text-slate-800 space-y-1.5">
            <p>
              <span className="font-semibold">Industry:</span> {selectedIndustry}
            </p>
            <p>
              <span className="font-semibold">Drivers:</span>{" "}
              {selectedDrivers.join(", ")}
            </p>
            <p>
              <span className="font-semibold">Change posture:</span>{" "}
              {selectedAggression}
            </p>
          </div>
        </Card>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[0.75rem] text-slate-500">
          Your selections will steer how Fuxi scores overlap, risk, and portfolio
          moves for project{" "}
          <span className="font-semibold">{projectId}</span>.
        </p>
        <button
          type="button"
          disabled={!ctaEnabled}
          onClick={handleContinue}
          className={
            "inline-flex items-center rounded-full px-5 py-2 text-[0.8rem] font-semibold " +
            (ctaEnabled
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500 cursor-not-allowed")
          }
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
