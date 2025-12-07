"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PromptBar } from "./PromptBar";
import { emitTelemetry } from "./telemetry";
import { Sidebar, type Mode } from "./Sidebar";
import { UXShellLayout } from "./UXShellLayout";
import GraphEmbed from "./embeds/GraphEmbed";
import ROISummaryEmbed from "./embeds/ROISummaryEmbed";
import SequencerEmbed from "./embeds/SequencerEmbed";
import ReviewEmbed from "./embeds/ReviewEmbed";
import { ConversationalAgent } from "@/components/ConversationalAgent";
import { AgentMemoryProvider, useAgentMemory, type AgentSuggestion } from "@/hooks/useAgentMemory";
import { AgentPreviewCard } from "@/components/agent/AgentPreviewCard";
import { pushWithContext, readRouteContext } from "@/lib/navigation/pushWithContext";

type View = "graph" | "roi" | "sequencer" | "review";

const projects = [
  { id: "700am", name: "700am — Core", status: "live" },
  { id: "951pm", name: "951pm — Pilot", status: "draft" },
  { id: "demo", name: "Demo Workspace", status: "demo" },
];

export function UnifiedLayout({ projectId }: { projectId?: string }) {
  const targetProject = projectId ?? projects[0]?.id ?? "demo";
  return (
    <AgentMemoryProvider projectId={targetProject}>
      <UnifiedLayoutBody projectId={targetProject} />
    </AgentMemoryProvider>
  );
}

function UnifiedLayoutBody({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>("graph");
  const [activeMode, setActiveMode] = useState<Mode>("Architect");
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const { state, queueSuggestion, dismissSuggestion, acceptSuggestion, recordView } = useAgentMemory();

  useEffect(() => {
    void emitTelemetry("uxshell_loaded", { projectId });
    const width = sidebarRef.current?.offsetWidth ?? 0;
    if (width > 320) {
      void emitTelemetry("uxshell_lock_violation", {
        width,
        maxAllowed: 320,
        timestamp: new Date().toISOString(),
      });
    }
  }, [projectId]);

  useEffect(() => {
    recordView(activeView);
  }, [activeView, recordView]);

  useEffect(() => {
    const ctx = readRouteContext();
    if (ctx?.targetView && ctx.href) {
      const resumeSuggestion: AgentSuggestion = {
        id: `resume-${ctx.targetView}-${ctx.suggestionId ?? "ctx"}`,
        title: "Resume where you left off",
        summary: "Pick up the last flow with your context intact.",
        ctaLabel: "Continue",
        route: ctx.href,
        targetView: ctx.targetView as View,
        icon: ctx.targetView as View,
        source: "route_context",
      };
      queueSuggestion(resumeSuggestion);
    }
  }, [queueSuggestion]);

  useEffect(() => {
    const suggestion = buildSuggestionForView(activeView, projectId);
    if (!suggestion) return;
    const timer = window.setTimeout(() => queueSuggestion(suggestion), 2500);
    return () => window.clearTimeout(timer);
  }, [activeView, projectId, queueSuggestion]);

  const handleView = (next: View) => {
    setActiveView(next);
    void emitTelemetry("uxshell_view_selected", { view: next, projectId });
  };

  const handleAcceptSuggestion = (id: string) => {
    const accepted = acceptSuggestion(id);
    if (accepted) {
      pushWithContext(router, accepted.route, { from: activeView, targetView: accepted.targetView, suggestionId: id });
    }
  };

  return (
    <div className="uxshell-root px-0 py-0">
      <UXShellLayout
        sidebar={
          <div ref={sidebarRef}>
            <Sidebar
              projectId={projectId}
              currentProjectId={projectId}
              currentView={activeView}
              onModeChange={(mode) => {
                setActiveMode(mode);
                void emitTelemetry("uxshell_mode_changed", { projectId, mode });
              }}
            />
          </div>
        }
      >
        {state.suggestions.length > 0 && (
          <div className="mb-3 space-y-2">
            {state.suggestions.map((suggestion) => (
              <AgentPreviewCard
                key={suggestion.id}
                title={suggestion.title}
                summary={suggestion.summary}
                ctaLabel={suggestion.ctaLabel}
                onAccept={() => handleAcceptSuggestion(suggestion.id)}
                onDismiss={() => dismissSuggestion(suggestion.id, "dismissed")}
              />
            ))}
          </div>
        )}
        <div className="grid w-full max-w-7xl grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow">
              {activeView === "graph" && <GraphEmbed projectId={projectId} />}
              {activeView === "roi" && (
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <ROISummaryEmbed projectId={projectId} />
                  <SequencerEmbed projectId={projectId} />
                </div>
              )}
              {activeView === "sequencer" && <SequencerEmbed projectId={projectId} />}
              {activeView === "review" && <ReviewEmbed projectId={projectId} />}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Command Deck</p>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={() => handleView("graph")}
                >
                  Open view
                </button>
              </div>
              <div className="mt-3">
                <PromptBar
                  onSubmit={(prompt) => setAgentPrompt(prompt)}
                  onAction={(action) => {
                    if (action.target) {
                      const href = `/project/${projectId}/${action.target}`;
                      void emitTelemetry("uxshell_action_invoked", { view: action.view, target: action.target });
                      pushWithContext(router, href, { from: activeView, targetView: action.view ?? undefined });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow">
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Insights</p>
              <p className="text-sm text-slate-700">Reserve this rail for contextual insights or alerts.</p>
            </div>
          </div>
        </div>
        <ConversationalAgent
          projectId={projectId}
          mode={activeMode}
          view={activeView}
          incomingPrompt={agentPrompt}
          onPromptConsumed={() => setAgentPrompt(null)}
        />
      </UXShellLayout>
    </div>
  );
}

function buildSuggestionForView(view: View, projectId: string): AgentSuggestion | null {
  switch (view) {
    case "graph":
      return {
        id: `anticipate-roi-${projectId}`,
        title: "Model ROI next",
        summary: "Systems are harmonized—ROI forecasts are ready to open.",
        ctaLabel: "Open ROI Dashboard",
        route: `/project/${projectId}/roi/hypothesis`,
        targetView: "roi",
        icon: "roi",
        source: "view_change",
      };
    case "roi":
      return {
        id: `anticipate-sequencer-${projectId}`,
        title: "Sequence modernization waves",
        summary: "Use sequencer to stage modernization before final approval.",
        ctaLabel: "Open Sequencer",
        route: `/project/${projectId}/sequencer`,
        targetView: "sequencer",
        icon: "sequencer",
        source: "view_change",
      };
    case "sequencer":
      return {
        id: `anticipate-review-${projectId}`,
        title: "Review harmonization deltas",
        summary: "Confirm dependencies before publishing the roadmap.",
        ctaLabel: "Open Review",
        route: `/project/${projectId}/review`,
        targetView: "review",
        icon: "review",
        source: "view_change",
      };
    case "review":
      return {
        id: `anticipate-graph-${projectId}`,
        title: "Revisit Digital Enterprise",
        summary: "Switch back to the enterprise graph to validate scope.",
        ctaLabel: "Open Graph",
        route: `/project/${projectId}/digital-enterprise`,
        targetView: "graph",
        icon: "graph",
        source: "view_change",
      };
    default:
      return null;
  }
}
