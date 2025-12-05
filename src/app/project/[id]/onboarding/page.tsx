"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useTelemetry } from "@/hooks/useTelemetry";

type Role = "Architect" | "Analyst" | "CIO" | "FP&A";

export default function GuidedOnboardingPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "demo";
  const telemetry = useTelemetry("guided_onboarding", { projectId });

  const [projectName, setProjectName] = useState(projectId);
  const [role, setRole] = useState<Role>("Architect");
  const [goal, setGoal] = useState("Modernize");
  const [pace, setPace] = useState("Moderate");
  const [startItems, setStartItems] = useState<Record<string, boolean>>({
    tech: false,
    roi: false,
    harmonize: false,
    roadmap: false,
    twin: false,
  });
  const [artifactsUploaded, setArtifactsUploaded] = useState(false);
  const [artifactTypes, setArtifactTypes] = useState<Record<string, boolean>>({
    inventory: true,
    current: true,
    future: true,
  });

  const summary = useMemo(
    () => ({
      systems: 27,
      integrations: 54,
      domains: 6,
    }),
    [],
  );

  const toggleStartItem = (key: string) => {
    setStartItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      telemetry.log("onboarding_start_choice", { key, active: next[key] });
      return next;
    });
  };

  const markUpload = () => {
    setArtifactsUploaded(true);
    telemetry.log("onboarding_artifacts_uploaded", { files: ["current_state.csv", "future_state.csv"] });
  };

  const toggleArtifactType = (key: string) => {
    setArtifactTypes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      telemetry.log("onboarding_artifact_type", { key, active: next[key] });
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Fuxi · Enterprise Engine</p>
            <h1 className="text-3xl font-semibold text-slate-900">Guided Onboarding</h1>
            <p className="text-sm text-slate-600">Conversational setup to get your workspace ready.</p>
          </div>
        </div>

        <Card className="flex flex-col gap-6 border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Assistant</p>
            <p className="text-sm text-slate-800">Welcome back, ready to explore your enterprise?</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => telemetry.log("onboarding_action", { action: "create_project" })}
            >
              Create Project
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => telemetry.log("onboarding_action", { action: "continue_project" })}
            >
              Continue Existing Project
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project Name</span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => telemetry.log("onboarding_project_named", { projectName })}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={role}
                onChange={(e) => {
                  const next = e.target.value as Role;
                  setRole(next);
                  telemetry.log("onboarding_role_selected", { role: next });
                }}
              >
                <option>Architect</option>
                <option>Analyst</option>
                <option>CIO</option>
                <option>FP&A</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Goal</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  telemetry.log("onboarding_goal_selected", { goal: e.target.value });
                }}
              >
                <option>Modernize</option>
                <option>Optimize</option>
                <option>Reduce Cost</option>
                <option>Accelerate AI</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pace</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={pace}
                onChange={(e) => {
                  setPace(e.target.value);
                  telemetry.log("onboarding_pace_selected", { pace: e.target.value });
                }}
              >
                <option>Moderate</option>
                <option>Rapid</option>
                <option>Conservative</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Where would you like to start?</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { key: "tech", label: "Define My Tech Stack" },
                { key: "roi", label: "Assess ROI" },
                { key: "harmonize", label: "Analyze Harmonization" },
                { key: "roadmap", label: "Build My Roadmap" },
                { key: "twin", label: "Visualize Digital Twin" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={startItems[key]}
                    onChange={() => toggleStartItem(key)}
                  />
                  <span className="text-slate-800">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Artifacts</p>
              <p className="text-sm text-slate-700">
                Do you have existing artifacts to use or analyze? Upload Lucid/CSV to jump-start ingestion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={markUpload}
              >
                Upload Files
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => telemetry.log("onboarding_action", { action: "skip_manual" })}
              >
                Skip & Build Manually
              </button>
            </div>
          </div>

          {artifactsUploaded && (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Artifacts detected</p>
              <p className="text-sm text-emerald-800">current_state.csv, future_state.csv</p>
              <div className="flex flex-wrap gap-2 text-sm text-slate-800">
                {["inventory", "current", "future"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      artifactTypes[key] ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                    }`}
                    onClick={() => toggleArtifactType(key)}
                  >
                    {key === "inventory" ? "Inventory" : key === "current" ? "Current State" : "Future State"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Systems</p>
              <p className="text-lg font-semibold text-slate-900">{summary.systems}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Integrations</p>
              <p className="text-lg font-semibold text-slate-900">{summary.integrations}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Domains</p>
              <p className="text-lg font-semibold text-slate-900">{summary.domains}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">What would you like to do next?</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                "Identify mismatches / naming issues",
                "Compare current vs. future state",
                "Estimate cost & ROI",
                "Sequence transformation",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    onChange={(e) => telemetry.log("onboarding_next_step", { step: label, active: e.target.checked })}
                  />
                  <span className="text-slate-800">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => telemetry.log("onboarding_action", { action: "open_roi_dashboard" })}
            >
              View ROI Dashboard
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => telemetry.log("onboarding_action", { action: "open_harmonization_review" })}
            >
              Go to Harmonization Review
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
