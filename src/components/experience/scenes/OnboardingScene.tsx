"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FileUploadPanel } from "@/components/panels/FileUploadPanel";
import { parseInventoryCsv } from "@/domain/services/inventoryIngestion";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAutoProceedPreference } from "@/hooks/useAgentPreferences";
import { ONBOARDING_SCRIPT } from "@/lib/agent/scripts/onboarding";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { Stage } from "@/components/layout/Stage";

export type OnboardingSceneProps = {
  projectId: string;
  onComplete?: () => void;
};

type Role = "Architect" | "Analyst" | "CIO" | "FP&A";

type ActivityEntry = { id: string; message: string; tone: "system" | "success"; timestamp: string };

export function AgentOnboardingScene({ projectId, onComplete }: OnboardingSceneProps) {
  const telemetry = useTelemetry("guided_onboarding", { projectId });
  const [autoProceed, setAutoProceed] = useAutoProceedPreference(false);
  const [projectName, setProjectName] = useState(projectId);
  const [role, setRole] = useState<Role>("Architect");
  const [goal, setGoal] = useState("Modernize");
  const [pace, setPace] = useState("Moderate");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const [readyToProceed, setReadyToProceed] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    {
      id: "intro",
      message: "Ready to ingest files or capture quick context. Use Chat Mode above if you need help from the agent.",
      tone: "system",
      timestamp: new Date().toISOString(),
    },
  ]);

  const pushActivity = (message: string, tone: ActivityEntry["tone"] = "system") => {
    setActivityLog((prev) => {
      const entry: ActivityEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone,
        timestamp: new Date().toISOString(),
      };
      return [entry, ...prev].slice(0, 5);
    });
  };

  useEffect(() => {
    telemetry.log("onboarding_loaded", { projectId });
    pushActivity("Project context loaded.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    telemetry.log("onboarding_intent_updated", { projectId, role, goal, pace });
  }, [telemetry, projectId, role, goal, pace]);

  const [summary, setSummary] = useState({
    systems: 0,
    integrations: 0,
    domains: 0,
  });
  const scriptPreview = ONBOARDING_SCRIPT.slice(0, 4);
  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none";
  const selectClass = `${inputClass} appearance-none font-sans`;

  const handleAutoProceedToggle = (nextValue: boolean) => {
    setAutoProceed(nextValue);
    pushActivity(nextValue ? "Auto-proceed enabled for future uploads." : "Auto-proceed disabled.");
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const text = await file.text();
      const parsed = parseInventoryCsv(text);
      setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size }]);
      setSummary({
        systems: parsed.uniqueSystems,
        integrations: Math.round(parsed.uniqueSystems * 2),
        domains: Math.max(1, Math.round(parsed.uniqueSystems / 4)),
      });
      telemetry.log("onboarding_artifact_uploaded", { projectId, file: file.name });
      void emitTelemetry("artifact_uploaded", { projectId, file: file.name, workspace_id: "uxshell" });
      pushActivity(`Ingested ${file.name}. I can summarize or open ROI next.`, "success");
      if (autoProceed) {
        pushActivity("Auto-proceed enabled — sending you to Digital Twin.", "success");
        onComplete?.();
      } else {
        setReadyToProceed(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process file";
      setUploadError(message);
      pushActivity("Upload failed — try a different file or ask the agent for help.");
    } finally {
      setUploading(false);
    }
  };

  const leftRail = (
    <div className="space-y-5 text-sm text-slate-600">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Project Snapshot</p>
        <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Name</p>
            <p className="text-sm font-semibold text-slate-900">{projectName || projectId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Role</p>
            <p className="text-sm font-semibold text-slate-900">{role}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Goal</p>
            <p className="text-sm font-semibold text-slate-900">{goal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pace</p>
            <p className="text-sm font-semibold text-slate-900">{pace}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Preferences</p>
        <p className="mt-2 text-sm text-slate-700">Auto-proceed to the Digital Twin once files are ingested.</p>
        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={autoProceed} onChange={(event) => handleAutoProceedToggle(event.target.checked)} />
          Enable auto-proceed
        </label>
        <p className="mt-1 text-[0.65rem] text-slate-500">You can change this at any time.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sync Summary</p>
        <dl className="mt-3 space-y-3 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <dt>Systems</dt>
            <dd className="font-semibold text-slate-900">{summary.systems}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Integrations</dt>
            <dd className="font-semibold text-slate-900">{summary.integrations}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Domains</dt>
            <dd className="font-semibold text-slate-900">{summary.domains}</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const rightRail = (
    <div className="space-y-5 text-sm text-slate-700">
      <Card className="space-y-3 border border-slate-200 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Recent guidance</p>
          <p className="text-xs text-slate-500">Use Chat Mode above for live agent help. Highlights appear here as you progress.</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
          {activityLog.map((entry) => (
            <div key={entry.id} className={entry.tone === "success" ? "text-emerald-700" : "text-slate-700"}>
              <p>{entry.message}</p>
              <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-3 border border-slate-200 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">EAgent onboarding script</p>
          <p className="text-xs text-slate-500">Preview of the conversational path the agent follows for first-time users.</p>
        </div>
        <ol className="space-y-2 text-sm text-slate-700">
          {scriptPreview.map((step) => (
            <li key={step.step} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Step {step.step}</p>
              <p className="mt-1 font-semibold text-slate-900">{step.greeting}</p>
              <p className="text-xs text-slate-600">{step.follow_up}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );

  return (
    <SceneTemplate leftRail={leftRail} rightRail={rightRail}>
      <Stage>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-2">
          <header>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Guided Onboarding</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Let’s configure this workspace</h1>
            <p className="text-sm text-slate-600">Share intent and upload artifacts so I can compress everything into your Digital Twin.</p>
          </header>

          <Card className="space-y-3 p-4">
            <p className="text-sm text-slate-600">Tell me about this project so I can configure the agent.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-slate-700">
                Project name
                <input className={inputClass} value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Role
                <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="Architect">Architect</option>
                  <option value="Analyst">Analyst</option>
                  <option value="CIO">CIO</option>
                  <option value="FP&A">FP&A</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Goal
                <select className={selectClass} value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option>Modernize</option>
                  <option>Cost</option>
                  <option>ROI</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Pace
                <select className={selectClass} value={pace} onChange={(e) => setPace(e.target.value)}>
                  <option>Moderate</option>
                  <option>Accelerated</option>
                  <option>Conservative</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <FileUploadPanel
              title="Upload artifacts"
              helper="Inventory CSV, architecture diagrams, sequencing decks"
              label={uploading ? "Uploading…" : "Drop files"}
              onFileSelected={handleUpload}
            />
            {uploadError ? <p className="text-xs text-rose-500">{uploadError}</p> : null}
            {uploadedFiles.length ? (
              <ul className="text-xs text-slate-600">
                {uploadedFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            ) : null}
            {readyToProceed ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Artifacts ingested.</p>
                <p className="mt-1 text-xs text-emerald-800">Ready to compress into the Digital Twin?</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500"
                    onClick={() => {
                      setReadyToProceed(false);
                      telemetry.log("decision_taken", { projectId, scene: "onboarding", decision: "proceed_to_digital_twin" });
                      onComplete?.();
                    }}
                  >
                    Proceed to Digital Twin
                  </button>
                  <p className="text-[0.65rem] text-emerald-800">Auto-proceed toggle lives in the Preferences rail.</p>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="px-4 py-3 text-sm text-slate-700">
              Systems synchronized: <span className="font-semibold text-slate-900">{summary.systems}</span>
            </Card>
            <Card className="px-4 py-3 text-sm text-slate-700">
              Integrations detected: <span className="font-semibold text-slate-900">{summary.integrations}</span>
            </Card>
            <Card className="px-4 py-3 text-sm text-slate-700">
              Domains mapped: <span className="font-semibold text-slate-900">{summary.domains}</span>
            </Card>
          </div>
        </div>
      </Stage>
    </SceneTemplate>
  );
}
