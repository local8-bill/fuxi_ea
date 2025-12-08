"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FileUploadPanel } from "@/components/panels/FileUploadPanel";
import { parseInventoryCsv } from "@/domain/services/inventoryIngestion";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAutoProceedPreference } from "@/hooks/useAgentPreferences";

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

  const [summary, setSummary] = useState({
    systems: 27,
    integrations: 54,
    domains: 7,
  });

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
      pushActivity(`Ingested ${file.name}. I can summarize or open ROI next.`, "success");
      if (autoProceed) {
        pushActivity("Auto-proceed enabled — sending you to Digital Twin.", "success");
        onComplete?.();
      } else {
        setReadyToProceed(true);
      }
    } catch (err: any) {
      setUploadError(err?.message ?? "Failed to process file");
      pushActivity("Upload failed — try a different file or ask the agent for help.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <p className="text-sm text-slate-600">Tell me about this project so I can configure the agent.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-700">
            Project name
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Role
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="Architect">Architect</option>
              <option value="Analyst">Analyst</option>
              <option value="CIO">CIO</option>
              <option value="FP&A">FP&A</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Goal
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>Modernize</option>
              <option>Cost</option>
              <option>ROI</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Pace
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" value={pace} onChange={(e) => setPace(e.target.value)}>
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
        {readyToProceed && (
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
              <label className="flex items-center gap-2 text-xs text-emerald-800">
                <input
                  type="checkbox"
                  checked={autoProceed}
                  onChange={(e) => {
                    setAutoProceed(e.target.checked);
                    pushActivity(e.target.checked ? "Auto-proceed enabled for future uploads." : "Auto-proceed disabled.");
                  }}
                />
                Auto-proceed after future uploads
              </label>
            </div>
          </div>
        )}
      </Card>

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
  );
}
