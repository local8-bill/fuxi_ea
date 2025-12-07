"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UXShellLayout } from "@/components/uxshell/UXShellLayout";
import { PromptBar } from "@/components/uxshell/PromptBar";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import type { AgentMessage } from "@/types/agent";

const DEFAULT_PROJECT_ID = "700am";

export default function LandingPage() {
  const router = useRouter();
  const [projectInput, setProjectInput] = useState(DEFAULT_PROJECT_ID);
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void emitTelemetry("landing_conversation_started", { route: "/" });
  }, []);

  const fetchConversation = useCallback(async (targetProjectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        projectId: targetProjectId,
        mode: "Architect",
        view: "graph",
        resume: "1",
      });
      const res = await fetch(`/api/agent/context?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setMessages(data.session?.messages ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Unable to load conversation.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversation(projectId);
  }, [projectId, fetchConversation]);

  const handlePromptSubmit = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt) return;
      const optimistic: AgentMessage = {
        id: `landing-user-${Date.now()}`,
        role: "user",
        content: prompt,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setBusy(true);
      setError(null);
      void emitTelemetry("landing_input_submitted", { projectId, prompt });
      try {
        const res = await fetch("/api/agent/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            message: prompt,
            context: { mode: "Architect", view: "graph" },
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Agent unavailable");
        }
        const data = await res.json();
        setMessages(data.session?.messages ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [projectId],
  );

  const handleContextApply = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = projectInput.trim();
      setProjectId(trimmed || DEFAULT_PROJECT_ID);
    },
    [projectInput],
  );

  const handleContinue = useCallback(() => {
    void emitTelemetry("onboarding_continued", { projectId, from: "landing" });
    router.push(`/project/${projectId}/onboarding`);
  }, [projectId, router]);

  const renderedMessages = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-500">
          Loading conversation…
        </div>
      );
    }
    if (!messages.length) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          I can prepare onboarding, connect telemetry, or open ROI when you're ready.
        </div>
      );
    }
    return messages.map((message) => (
      <div
        key={message.id}
        className={`w-full rounded-2xl px-3 py-2 text-sm ${
          message.role === "assistant"
            ? "bg-slate-50 text-slate-800 border border-slate-200"
            : message.role === "system"
              ? "bg-white/70 text-slate-500 border border-dashed border-slate-200"
              : "bg-slate-900 text-white ml-auto"
        }`}
      >
        <div className="whitespace-pre-wrap text-left">{message.content}</div>
      </div>
    ));
  }, [loading, messages]);

  return (
    <UXShellLayout sidebarHidden sidebar={null}>
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <p className="text-[0.55rem] uppercase tracking-[0.5em] text-slate-400">Unified Experience Shell</p>
          <h1 className="text-4xl font-semibold text-slate-900">Hello</h1>
          <p className="text-sm text-slate-500">Ask Fuxi where to start — onboarding, ROI, or harmonization.</p>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">{renderedMessages}</div>
            {error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}
          </div>

          <PromptBar
            onSubmit={handlePromptSubmit}
            placeholder="Ask Fuxi where to start…"
            disabled={busy || loading}
          />

          <form
            onSubmit={handleContextApply}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm"
          >
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Project context</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="Project ID (e.g., 700am)"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Set context
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Continue onboarding
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Current session: {projectId}</p>
          </form>
        </div>
      </div>
    </UXShellLayout>
  );
}
