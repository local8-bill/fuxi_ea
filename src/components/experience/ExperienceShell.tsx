"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UXShellLayout } from "../uxshell/UXShellLayout";
import { Sidebar, type Mode } from "../uxshell/Sidebar";
import { PromptBar } from "../uxshell/PromptBar";
import { emitTelemetry } from "../uxshell/telemetry";
import SequencerEmbed from "../uxshell/embeds/SequencerEmbed";
import ReviewEmbed from "../uxshell/embeds/ReviewEmbed";
import { AgentPreviewCard } from "../agent/AgentPreviewCard";
import { ConversationalAgent } from "../ConversationalAgent";
import { AgentMemoryProvider, useAgentMemory } from "@/hooks/useAgentMemory";
import { AgentOnboardingScene } from "./scenes/OnboardingScene";
import { ROIScene } from "./scenes/ROIScene";
import { DigitalEnterpriseClient } from "@/app/project/[id]/digital-enterprise/DigitalEnterpriseClient";
import { useExperienceFlow, setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";
import { useTelemetry } from "@/hooks/useTelemetry";
import "@/styles/uxshell.css";

const sceneMeta: Record<ExperienceScene, { title: string; summary: string }> = {
  command: { title: "Command Deck", summary: "Resume where you left off or ask the agent what's next." },
  onboarding: { title: "Guided Onboarding", summary: "Ingest files and capture context." },
  digital: { title: "Digital Twin", summary: "Explore the harmonized enterprise map." },
  roi: { title: "ROI Dashboard", summary: "Forecast ROI/TCC impact with guidance." },
  sequencer: { title: "Sequencer", summary: "Stage modernization waves before execution." },
  review: { title: "Review", summary: "Validate harmonization deltas and approvals." },
};

export function ExperienceShell({ projectId }: { projectId: string }) {
  return (
    <AgentMemoryProvider projectId={projectId}>
      <ExperienceBody projectId={projectId} />
    </AgentMemoryProvider>
  );
}

function ExperienceBody({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scene, setScene } = useExperienceFlow(projectId);
  const telemetry = useTelemetry("experience_shell", { projectId });
  const [mode, setMode] = useState<Mode>("Architect");
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  useAgentMemory();

  useEffect(() => {
    const queryScene = searchParams?.get("scene") as ExperienceScene | null;
    if (queryScene && queryScene !== scene) {
      setScene(queryScene);
      setExperienceScene(projectId, queryScene);
    }
  }, [searchParams, scene, projectId, setScene]);

  useEffect(() => {
    telemetry.log("agent_flow_transition", { scene });
  }, [scene, telemetry]);

  useEffect(() => {
    const width = sidebarRef.current?.offsetWidth ?? 0;
    if (width > 320) {
      void emitTelemetry("uxshell_layout_violation", {
        width,
        maxAllowed: 320,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const handleSceneChange = (next: ExperienceScene) => {
    if (next === scene) return;
    setScene(next);
    setExperienceScene(projectId, next);
    telemetry.log("agent_flow_transition", { from: scene, to: next });
    router.replace(`/project/${projectId}/experience?scene=${next}`, { scroll: false });
  };

  const meta = sceneMeta[scene];

  return (
    <UXShellLayout
      sidebar={
        <div ref={sidebarRef}>
          <Sidebar projectId={projectId} currentProjectId={projectId} currentView={scene} onModeChange={setMode} />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">Experience Flow</p>
              <h1 className="text-xl font-semibold text-slate-900">{meta.title}</h1>
              <p className="text-sm text-slate-600">{meta.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(sceneMeta) as ExperienceScene[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSceneChange(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    key === scene
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                  }`}
                >
                  {sceneMeta[key].title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {scene === "command" && <CommandDeckScene projectId={projectId} onNavigate={handleSceneChange} />}
            {scene === "onboarding" && <AgentOnboardingScene projectId={projectId} onComplete={() => handleSceneChange("digital")} />}
            {scene === "digital" && <DigitalEnterpriseClient projectId={projectId} />}
            {scene === "roi" && <ROIScene projectId={projectId} />}
            {scene === "sequencer" && <SequencerEmbed projectId={projectId} />}
            {scene === "review" && <ReviewEmbed projectId={projectId} />}
          </div>
          <div className="space-y-4">
            <PromptBar placeholder="Ask where to go next…" onSubmit={(value) => telemetry.log("experience_prompt", { projectId, value })} />
            <ConversationalAgent projectId={projectId} mode={mode} view={scene} />
          </div>
        </div>
      </div>
    </UXShellLayout>
  );
}

type CommandDeckProps = {
  projectId: string;
  onNavigate: (scene: ExperienceScene) => void;
};

function CommandDeckScene({ projectId, onNavigate }: CommandDeckProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow">
        <p className="text-sm text-slate-700">You left off in harmonization. Ready to resume sequence?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white"
            onClick={() => onNavigate("digital")}
          >
            Open Digital Twin
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700"
            onClick={() => onNavigate("roi")}
          >
            Check ROI
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700"
            onClick={() => onNavigate("onboarding")}
          >
            Update Onboarding
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AgentPreviewCard
          title="Resume Harmonization"
          summary="Pick up the validation sequence with all prior decisions in context."
          ctaLabel="Resume"
          onAccept={() => onNavigate("review")}
        />
        <AgentPreviewCard
          title="Run ROI Scenario"
          summary="Quantify the latest sequencing decisions before sharing with finance."
          ctaLabel="Open ROI"
          onAccept={() => onNavigate("roi")}
        />
      </div>

    </div>
  );
}
