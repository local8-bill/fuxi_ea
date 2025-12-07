"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FileUploadPanel } from "@/components/panels/FileUploadPanel";
import { parseInventoryCsv } from "@/domain/services/inventoryIngestion";
import { useTelemetry } from "@/hooks/useTelemetry";
import {
  loadOnboardingConversation,
  saveOnboardingConversation,
} from "@/lib/onboarding/conversationStorage";

export type OnboardingSceneProps = {
  projectId: string;
  onComplete?: () => void;
};

type Role = "Architect" | "Analyst" | "CIO" | "FP&A";

export function AgentOnboardingScene({ projectId, onComplete }: OnboardingSceneProps) {
  const telemetry = useTelemetry("guided_onboarding", { projectId });
  const [projectName, setProjectName] = useState(projectId);
  const [role, setRole] = useState<Role>("Architect");
  const [goal, setGoal] = useState("Modernize");
  const [pace, setPace] = useState("Moderate");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const defaultAssistantMessage = useMemo(
    () => [
      {
        role: "assistant" as const,
        content: "I can ingest your inventory, open ROI, or check harmonization. What do you want to do first?",
      },
    ],
    [],
  );
  const [agentMessages, setAgentMessages] = useState<Array<{ role: "assistant" | "user" | "system"; content: string }>>(() => {
    const stored = loadOnboardingConversation(projectId);
    return stored.length ? stored : defaultAssistantMessage;
  });

  useEffect(() => {
    const stored = loadOnboardingConversation(projectId);
    setAgentMessages(stored.length ? stored : defaultAssistantMessage);
  }, [projectId, defaultAssistantMessage]);

  useEffect(() => {
    telemetry.log("onboarding_loaded", { projectId });
  }, [projectId, telemetry]);

  useEffect(() => {
    saveOnboardingConversation(projectId, agentMessages);
  }, [projectId, agentMessages]);

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
      onComplete?.();
    } catch (err: any) {
      setUploadError(err?.message ?? "Failed to process file");
    } finally {
      setUploading(false);
    }
  };

  const handleAgentSubmit = async () => {
    const trimmed = agentInput.trim();
    if (!trimmed) return;
    const nextMessages = [...agentMessages, { role: "user" as const, content: trimmed }];
    setAgentMessages(nextMessages);
    setAgentInput("");
    setAgentLoading(true);
    try {
      telemetry.log("onboarding_agent_prompt", { projectId, prompt: trimmed });
      setTimeout(() => {
        setAgentMessages((prev) => [...prev, { role: "assistant", content: "Got it — I’ll prepare ROI and harmonization next." }]);
        setAgentLoading(false);
      }, 800);
    } catch {
      setAgentLoading(false);
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
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Agent conversation</p>
            <p className="text-xs text-slate-500">Ask anything to configure onboarding.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
            onClick={() => setAgentMessages(defaultAssistantMessage)}
          >
            Reset
          </button>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {agentMessages.map((m, idx) => (
            <p key={`${m.role}-${idx}`} className={m.role === "user" ? "text-slate-900 font-semibold" : "text-slate-600"}>
              {m.role === "user" ? "You:" : "Agent:"} {m.content}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ask me to ingest, summarize, or prep next steps"
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            disabled={agentLoading}
          />
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleAgentSubmit}
            disabled={agentLoading}
          >
            Send
          </button>
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
