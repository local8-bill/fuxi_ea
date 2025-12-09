"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UXShellLayout } from "../uxshell/UXShellLayout";
import { Sidebar, type Mode } from "../uxshell/Sidebar";
import { PromptBar } from "../uxshell/PromptBar";
import { emitTelemetry } from "../uxshell/telemetry";
import ROISummaryEmbed from "../uxshell/embeds/ROISummaryEmbed";
import SequencerEmbed from "../uxshell/embeds/SequencerEmbed";
import ReviewEmbed from "../uxshell/embeds/ReviewEmbed";
import { AgentPreviewCard } from "../agent/AgentPreviewCard";
import { ConversationalAgent } from "../ConversationalAgent";
import { AgentMemoryProvider, useAgentMemory } from "@/hooks/useAgentMemory";
import { AgentOnboardingScene } from "./scenes/OnboardingScene";
import { ROIScene } from "./scenes/ROIScene";
import { DigitalEnterpriseClient, DigitalTwinTelemetryCard, type DigitalEnterpriseStats } from "@/app/project/[id]/digital-enterprise/DigitalEnterpriseClient";
import { InsightsScene } from "./scenes/InsightsScene";
import { useExperienceFlow, setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useUserGenome, type InteractionStyle, type UserGenomeState } from "@/lib/context/userGenome";
import { useAgentModePreference } from "@/hooks/useAgentPreferences";
import { routeQuery } from "@/lib/agent/queryRouter";
import { SearchModal, type SearchItem } from "../uxshell/SearchModal";
import "@/styles/uxshell.css";
import { getCurrentMode, switchMode } from "@/lib/context/modeSwitcher";
import { AdaptiveSignalsPanel } from "@/components/learning/AdaptiveSignalsPanel";
import { useLearningSnapshot, type LearningSnapshot } from "@/hooks/useLearningSnapshot";

const sceneMeta: Record<ExperienceScene, { title: string; summary: string }> = {
  command: { title: "Command Deck", summary: "Resume where you left off or ask the agent what's next." },
  onboarding: { title: "Guided Onboarding", summary: "Ingest files and capture context." },
  digital: { title: "Digital Twin", summary: "Explore the harmonized enterprise map." },
  roi: { title: "ROI Dashboard", summary: "Forecast ROI/TCC impact with guidance." },
  sequencer: { title: "Sequencer", summary: "Stage modernization waves before execution." },
  review: { title: "Review", summary: "Validate harmonization deltas and approvals." },
  insights: { title: "Insights", summary: "Summaries, impact, and friction hot spots." },
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
  const [agentMode, setAgentMode] = useAgentModePreference("deck");
  const [pendingAgentPrompt, setPendingAgentPrompt] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [digitalStats, setDigitalStats] = useState<DigitalEnterpriseStats | null>(null);
  const { snapshot: learningSnapshot } = useLearningSnapshot(projectId);
  const [initialSceneTs] = useState(() => Date.now());
  const sceneTimingRef = useRef<{ scene: ExperienceScene; ts: number }>({ scene, ts: initialSceneTs });
  const genome = useUserGenome();
  const updateGenome = useUserGenome((state) => state.updateGenome);
  useAgentMemory();

  const intelligenceFocus = searchParams?.get("focus");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.FuxiModeSwitcher = { switchMode, getCurrentMode };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadManifest = async () => {
      try {
        const res = await fetch("/api/identity/manifest", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.founder) {
          const patch: Partial<UserGenomeState> = {};
          if (json.founder.role) patch.role = json.founder.role;
          if (json.founder.mission) patch.motivation = json.founder.mission;
          if (json.founder.interaction_style) {
            patch.interactionStyle = json.founder.interaction_style as InteractionStyle;
          }
          if (json.founder.tone) {
            patch.preferredTone = json.founder.tone as UserGenomeState["preferredTone"];
          }
          if (Array.isArray(json.founder.focus_domains)) {
            patch.focusDomains = json.founder.focus_domains;
          }
          patch.manifestId = json.founder.id;
          updateGenome(patch);
        }
        if (json?.pairing?.pairing_status) {
          updateGenome({ pairingStatus: json.pairing.pairing_status });
        }
      } catch {
        // ignore
      }
    };
    void loadManifest();
    return () => {
      cancelled = true;
    };
  }, [updateGenome]);

  useEffect(() => {
    const queryScene = searchParams?.get("scene") as ExperienceScene | null;
    if (queryScene && queryScene !== scene) {
      setScene(queryScene);
      setExperienceScene(projectId, queryScene);
    }
  }, [searchParams, scene, projectId, setScene]);

  useEffect(() => {
    const now = Date.now();
    const last = sceneTimingRef.current;
    if (last.scene === scene) {
      sceneTimingRef.current = { scene, ts: now };
    } else {
      const duration = Math.max(0, now - last.ts);
      if (duration > 0) {
        telemetry.log("scene_view_time", { scene: last.scene, duration_ms: duration });
      }
      sceneTimingRef.current = { scene, ts: now };
    }
    telemetry.log("scene_viewed", { scene });
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

  const handleSceneChange = useCallback(
    (next: ExperienceScene) => {
      if (next === scene) return;
      setScene(next);
      setExperienceScene(projectId, next);
      telemetry.log("agent_flow_transition", { from: scene, to: next });
      router.replace(`/project/${projectId}/experience?scene=${next}`, { scroll: false });
    },
    [projectId, router, scene, setScene, telemetry],
  );

  const meta = sceneMeta[scene];

  const searchItems = useMemo<SearchItem[]>(
    () => [
      {
        id: "digital",
        title: "Digital Twin View",
        description: "Explore the harmonized enterprise landscape.",
        keywords: ["graph", "map", "twin"],
        action: () => {
          void emitTelemetry("search.result_selected", { projectId, result: "digital" });
          handleSceneChange("digital");
        },
      },
      {
        id: "roi",
        title: "ROI Dashboard",
        description: "Quantify benefits, TCC, and sequencing ROI.",
        keywords: ["roi", "finance", "return"],
        action: () => {
          void emitTelemetry("search.result_selected", { projectId, result: "roi" });
          handleSceneChange("roi");
        },
      },
      {
        id: "sequencer",
        title: "Sequencer",
        description: "Stage modernization waves with confidence.",
        keywords: ["sequence", "roadmap"],
        action: () => {
          void emitTelemetry("search.result_selected", { projectId, result: "sequencer" });
          handleSceneChange("sequencer");
        },
      },
      {
        id: "review",
        title: "Review & Harmonization",
        description: "Validate deltas and overlaps across systems.",
        keywords: ["review", "harmonization", "delta"],
        action: () => {
          void emitTelemetry("search.result_selected", { projectId, result: "review" });
          handleSceneChange("review");
        },
      },
    ],
    [handleSceneChange, projectId],
  );

  const dispatchQuery = useCallback(
    (prompt: string, source: "deck" | "hotkey" | "modal" = "deck") => {
      const route = routeQuery(prompt, { projectId, scene, mode });
      void emitTelemetry("agent_query_submitted", { projectId, scene, via: source, target: route.target });
      if (route.target === "search") {
        setSearchQuery(route.query);
        setSearchOpen(true);
        void emitTelemetry("search.quick_open", { projectId, source });
        return;
      }
      if (route.target === "contextual") {
        if (route.scene) {
          handleSceneChange(route.scene);
        }
        void emitTelemetry("agent_intent.triggered", { projectId, prompt, scene: route.scene ?? scene });
        return;
      }
      if (route.prompt) {
        setPendingAgentPrompt(route.prompt);
        if (agentMode !== "agent") {
          setAgentMode("agent");
          void emitTelemetry("agent_mode_switch", { projectId, mode: "agent", source: "auto" });
        }
      }
    },
    [agentMode, handleSceneChange, mode, projectId, scene, setAgentMode],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchQuery("");
        setSearchOpen(true);
        void emitTelemetry("search.quick_open", { projectId, source: "hotkey" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [projectId]);

  return (
    <UXShellLayout
      sidebar={
        <div ref={sidebarRef}>
          <Sidebar projectId={projectId} currentProjectId={projectId} currentView={scene} currentFocus={intelligenceFocus} onModeChange={setMode} />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">Experience Flow</p>
              <h1 className="text-xl font-semibold text-slate-900">{meta.title}</h1>
              <p className="text-sm text-slate-600">{meta.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-2">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500 sm:text-right">Chat Mode</p>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[0.7rem] font-semibold text-slate-600">
                {(["deck", "agent"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-full px-2.5 py-0.5 transition ${agentMode === option ? "bg-slate-900 text-white shadow" : ""}`}
                    onClick={() => {
                      if (agentMode === option) return;
                      setAgentMode(option);
                      void emitTelemetry("agent_mode_switch", { projectId, mode: option, source: "manual" });
                    }}
                  >
                    {option === "deck" ? "Command Deck" : "Agent"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            {agentMode === "deck" ? (
              <PromptBar placeholder="Ask where to go next…" onSubmit={(value) => dispatchQuery(value, "deck")} />
            ) : (
              <ConversationalAgent
                projectId={projectId}
                mode={mode}
                view={scene}
                incomingPrompt={pendingAgentPrompt}
                onPromptConsumed={() => setPendingAgentPrompt(null)}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          {scene === "command" && (
            <CommandDeckScene projectId={projectId} onNavigate={handleSceneChange} role={genome.role} motivation={genome.motivation} learningSnapshot={learningSnapshot} />
          )}
          {scene === "onboarding" && <AgentOnboardingScene projectId={projectId} onComplete={() => handleSceneChange("digital")} />}
          {scene === "digital" && <DigitalEnterpriseClient projectId={projectId} onStatsUpdate={setDigitalStats} learningSnapshot={learningSnapshot} />}
          {scene === "roi" && <ROIScene projectId={projectId} />}
            {scene === "sequencer" && <SequencerEmbed projectId={projectId} />}
            {scene === "review" && <ReviewEmbed projectId={projectId} />}
            {scene === "insights" && <InsightsScene projectId={projectId} />}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ROISummaryEmbed projectId={projectId} />
          </div>
          {scene === "digital" ? <DigitalTwinTelemetryCard stats={digitalStats} /> : null}
        </div>
      </div>
      <SearchModal open={searchOpen} initialQuery={searchQuery} items={searchItems} onClose={() => setSearchOpen(false)} />
    </UXShellLayout>
  );
}

type CommandDeckProps = {
  projectId: string;
  onNavigate: (scene: ExperienceScene) => void;
  role: string;
  motivation: string;
  learningSnapshot: LearningSnapshot | null | undefined;
};

function CommandDeckScene({ projectId, onNavigate, role, motivation, learningSnapshot }: CommandDeckProps) {
  const personaCopy = useMemo(() => {
    const base = motivation ? motivation : "Ready to resume sequence?";
    if (role.toLowerCase().includes("cfo")) return `Finance lane is warmed up. ${base}`;
    if (role.toLowerCase().includes("analyst")) return `Insights stream is synced. ${base}`;
    return `You left off in harmonization. ${base}`;
  }, [role, motivation]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow">
        <p className="text-sm text-slate-700">{personaCopy}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Open Digital Twin", scene: "digital" },
            { label: "Check ROI", scene: "roi" },
            { label: "Update Onboarding", scene: "onboarding" },
          ].map((cta) => (
            <button
              key={cta.label}
              type="button"
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-800 hover:border-slate-900"
              onClick={() => {
                void emitTelemetry("decision_taken", {
                  projectId,
                  scene: "command",
                  decision: cta.scene,
                  label: cta.label,
                });
                onNavigate(cta.scene as ExperienceScene);
              }}
            >
              {cta.label}
            </button>
          ))}
        </div>
        <AdaptiveSignalsPanel snapshot={learningSnapshot} title="Command Signals" subtitle="Cadence overview" className="mt-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AgentPreviewCard
          title="Resume Harmonization"
          summary="Pick up the validation sequence with all prior decisions in context."
          ctaLabel="Resume"
          onAccept={() => {
            void emitTelemetry("decision_taken", { projectId, scene: "command", decision: "resume_harmonization" });
            onNavigate("review");
          }}
        />
        <AgentPreviewCard
          title="Run ROI Scenario"
          summary="Quantify the latest sequencing decisions before sharing with finance."
          ctaLabel="Open ROI"
          onAccept={() => {
            void emitTelemetry("decision_taken", { projectId, scene: "command", decision: "run_roi_scenario" });
            onNavigate("roi");
          }}
        />
      </div>

    </div>
  );
}
