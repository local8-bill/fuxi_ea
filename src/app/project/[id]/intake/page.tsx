"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import { useTelemetry } from "@/hooks/useTelemetry";

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
    });
    router.push(`/project/${projectId}/tech-stack`);
  }

  const canContinue =
    !!selectedIndustry && selectedDrivers.length > 0 && !!selectedAggression;

  useEffect(() => {
    telemetry.log("intake_view", { projectId });
  }, [projectId, telemetry]);

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

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[0.75rem] text-slate-500">
          Your selections will steer how Fuxi scores overlap, risk, and portfolio
          moves for project{" "}
          <span className="font-semibold">{projectId}</span>.
        </p>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={
            "inline-flex items-center rounded-full px-5 py-2 text-[0.8rem] font-semibold " +
            (canContinue
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500 cursor-not-allowed")
          }
        >
          Continue to Tech Stack
        </button>
      </div>
    </div>
  );
}
