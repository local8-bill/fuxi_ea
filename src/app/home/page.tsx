"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UXShellLayout } from "@/components/uxshell/UXShellLayout";
import { PromptBar } from "@/components/uxshell/PromptBar";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import type { AgentMessage } from "@/types/agent";
import { saveOnboardingConversation } from "@/lib/onboarding/conversationStorage";
import "@/styles/uxshell.css";

const DEFAULT_PROJECT = "700am";

type HomeSuggestion = {
  id: string;
  label: string;
  description: string;
  action: "resume" | "onboarding" | "demo" | "help";
  topic?: string;
};

type HomeSession = {
  projectId: string;
  lastStage?: string | null;
  lastIntent?: string | null;
  lastSeen?: string | null;
  firstTime?: boolean;
};

type HomeContext = {
  session: HomeSession;
  userType: "first_time" | "returning";
  prompt: string;
  suggestions: HomeSuggestion[];
};

export default function HomePage() {
  const router = useRouter();
  const [context, setContext] = useState<HomeContext | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [helpTopic, setHelpTopic] = useState<string>("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [ctaError, setCtaError] = useState<string | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/home/context", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as HomeContext;
        setContext(data);
        if (data.userType === "first_time") {
          void emitTelemetry("first_time_user", { workspace_id: "uxshell", projectId: data.session.projectId });
        } else {
          void emitTelemetry("resume_prompt_shown", { workspace_id: "uxshell", projectId: data.session.projectId });
        }
        await fetchConversation(data.session.projectId);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load home context.");
      } finally {
        setLoading(false);
      }
    };
    void loadContext();
  }, []);

  const fetchConversation = useCallback(async (projectId: string) => {
    try {
      const params = new URLSearchParams({ projectId, mode: "Architect", view: "graph", resume: "1" });
      const res = await fetch(`/api/agent/context?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(data.session?.messages ?? []);
    } catch (err: any) {
      setMessages([
        {
          id: "home-error",
          role: "assistant",
          content: err?.message ?? "I can start fresh whenever you need.",
          ts: Date.now(),
        },
      ]);
    }
  }, []);

  const projectId = context?.session.projectId ?? DEFAULT_PROJECT;

  const persistHomeState = useCallback(async (payload: Partial<HomeSession>) => {
    try {
      await fetch("/api/home/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...payload }),
      });
    } catch {
      // best effort
    }
  }, [projectId]);

  const handleCreateProject = useCallback(async () => {
    setCreatingProject(true);
    setCtaError(null);
    try {
      const res = await fetch("/api/projects/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { source: "home_cta" } }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newProjectId = data?.projectId;
      if (!newProjectId) throw new Error("Project id missing from response.");
      await persistHomeState({
        projectId: newProjectId,
        lastStage: "onboarding",
        lastIntent: "create_project",
        firstTime: false,
        lastSeen: new Date().toISOString(),
      });
      void emitTelemetry("project_created", { workspace_id: "uxshell", projectId: newProjectId, source: "home_cta" });
      router.push(`/project/${newProjectId}/experience?scene=onboarding`);
    } catch (err: any) {
      setCtaError(err?.message ?? "Unable to create a project. Try again.");
    } finally {
      setCreatingProject(false);
    }
  }, [persistHomeState, router]);

  const handlePrompt = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const optimistic: AgentMessage = { id: `home-user-${Date.now()}`, role: "user", content: prompt, ts: Date.now() };
    setMessages((prev) => [...prev, optimistic]);
    setBusy(true);
    setError(null);
    void emitTelemetry("home_prompt_submitted", { workspace_id: "uxshell", projectId, prompt: trimmed });
    try {
      const res = await fetch("/api/agent/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: trimmed, context: { mode: "Architect", view: "graph" } }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(data.session?.messages ?? []);
      await persistHomeState({ lastIntent: data.intent?.id ?? "prompt" });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [projectId, persistHomeState]);

  const handleSuggestion = useCallback(async (suggestion: HomeSuggestion) => {
    if (!context) return;
    switch (suggestion.action) {
      case "resume": {
        void emitTelemetry("next_step", { workspace_id: "uxshell", projectId });
        await persistHomeState({ lastStage: context?.session.lastStage ?? "command_deck", lastSeen: new Date().toISOString() });
        router.push(`/project/${projectId}/dashboard`);
        break;
      }
      case "onboarding": {
        void emitTelemetry("help_topic_accessed", { workspace_id: "uxshell", projectId, topic: "onboarding" });
        await persistHomeState({ lastStage: "onboarding", lastIntent: "start" });
        router.push(`/project/${projectId}/onboarding`);
        break;
      }
      case "demo": {
        void emitTelemetry("assistive_mode_triggered", { workspace_id: "uxshell", projectId });
        await persistHomeState({ lastStage: "demo", lastIntent: "explain" });
        router.push(`/project/${projectId}/dashboard?demo=1`);
        break;
      }
      case "help": {
        void emitTelemetry("help_topic_accessed", { workspace_id: "uxshell", projectId, topic: suggestion.topic });
        setHelpTopic(suggestion.description);
        break;
      }
      default:
        break;
    }
  }, [context, persistHomeState, projectId, router]);

  const conversationPairs = useMemo(() => {
    const pairs: Array<{ id: string; user: AgentMessage; replies: AgentMessage[] }> = [];
    messages.forEach((msg) => {
      if (msg.role === "user") {
        pairs.push({ id: msg.id, user: msg, replies: [] });
        return;
      }
      if (!pairs.length) return;
      const last = pairs[pairs.length - 1];
      if (msg.role === "assistant" || msg.role === "system") {
        last.replies.push(msg);
      }
    });
    return pairs;
  }, [messages]);

  const [openPairs, setOpenPairs] = useState<Record<string, boolean>>({});

  const togglePair = useCallback((id: string) => {
    setOpenPairs((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderedMessages = useMemo(() => {
    if (!conversationPairs.length) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          I can harmonize systems, forecast ROI, or walk you through a guided demo. Ask anything.
        </div>
      );
    }
    return conversationPairs.map((pair) => {
      const isOpen = openPairs[pair.id];
      return (
        <div key={pair.id} className="rounded-2xl border border-slate-200 bg-white/90">
          <button
            type="button"
            onClick={() => togglePair(pair.id)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-slate-900"
          >
            <span className="truncate">{pair.user.content}</span>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{isOpen ? "Hide" : "Show"}</span>
          </button>
          {isOpen ? (
            <div className="space-y-2 px-3 pb-3">
              {pair.replies.length ? (
                pair.replies.map((reply) => (
                  <div key={reply.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <div className="whitespace-pre-wrap">{reply.content}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Waiting for the assistant response…</p>
              )}
            </div>
          ) : (
            <p className="px-3 pb-3 text-xs text-slate-500">Tap to view the assistant’s response</p>
          )}
        </div>
      );
    });
  }, [conversationPairs, openPairs, togglePair]);

  useEffect(() => {
    saveOnboardingConversation(
      projectId,
      messages.map((msg) => ({ role: msg.role, content: msg.content })),
    );
  }, [messages, projectId]);

  return (
    <UXShellLayout sidebarHidden sidebar={null}>
      <div className="min-h-[calc(100vh-48px)] bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="space-y-2 text-center">
            <p className="text-[0.55rem] uppercase tracking-[0.5em] text-slate-400">Command Deck</p>
            <h1 className="text-4xl font-semibold text-slate-900">{context?.userType === "first_time" ? "Welcome" : "Welcome back"}</h1>
            <p className="text-sm text-slate-500">{context?.prompt ?? "I remember where we left off and can guide the next step."}</p>
          </div>

          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Start here</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create a Project</h2>
            <p className="mt-1 text-sm text-slate-600">Spin up a guided workspace, upload your tech inventory, and let the EAgent narrate Digital Twin → ROI within minutes.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleCreateProject()}
                disabled={creatingProject}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {creatingProject ? "Preparing workspace…" : "Create a Project"}
              </button>
              <p className="text-xs text-slate-500">No setup required — CSV, Excel, PDF, or sample data supported.</p>
            </div>
            {ctaError ? <p className="mt-2 text-xs text-rose-500">{ctaError}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow">
                <div className="flex flex-col gap-3">
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading your last session…</p>
                  ) : (
                    <>{renderedMessages}</>
                  )}
                  {error ? <p className="text-xs text-rose-500">{error}</p> : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <PromptBar
                    placeholder="Ask where to go next…"
                    disabled={busy}
                    onSubmit={(value) => void handlePrompt(value)}
                  />
                </div>
              </div>

              {context?.userType === "returning" && (context?.suggestions ?? []).length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {(context?.suggestions ?? []).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => void handleSuggestion(suggestion)}
                      className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left transition hover:border-slate-900"
                    >
                      <p className="text-sm font-semibold text-slate-900">{suggestion.label}</p>
                      <p className="text-xs text-slate-600">{suggestion.description}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {helpTopic ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {helpTopic}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Session Memory</p>
                <p className="mt-2 text-sm text-slate-600">
                  Project {projectId} · Last stage: {context?.session.lastStage ?? "Command Deck"}
                </p>
                <p className="text-sm text-slate-500">Last intent: {context?.session.lastIntent ?? "explore"}</p>
                <p className="text-xs text-slate-400">Seen: {context?.session.lastSeen ? new Date(context.session.lastSeen).toLocaleString() : "Just now"}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm space-y-2">
                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Need ideas?</p>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:border-slate-900"
                  onClick={() =>
                    handleSuggestion({
                      id: "help-harmonization",
                      label: "Explain harmonization",
                      description: "Harmonization connects systems by mapping overlaps between Finance and ERP, staging dependencies for sequencing.",
                      action: "help",
                      topic: "harmonization",
                    })
                  }
                >
                  Explain harmonization
                </button>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:border-slate-900"
                  onClick={() =>
                    handleSuggestion({
                      id: "help-roi",
                      label: "Explain ROI forecast",
                      description: "ROI forecasting aligns break-even month, TCC, and benefit horizons. I can walk through a sample scenario or use your live data.",
                      action: "help",
                      topic: "roi",
                    })
                  }
                >
                  Explain ROI forecast
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UXShellLayout>
  );
}
