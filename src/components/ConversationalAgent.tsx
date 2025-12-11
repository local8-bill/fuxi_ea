"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentIntentAction, AgentMessage, AgentTelemetryEvent, AgentMemory } from "@/types/agent";
import { useAgentMemory, type AgentSuggestion } from "@/hooks/useAgentMemory";
import { getActionDelay } from "@/lib/agent/timingHooks";
import { emitTelemetry } from "@/components/uxshell/telemetry";

type ConversationalAgentProps = {
  projectId: string;
  mode: string;
  view: string;
  incomingPrompt?: string | null;
  onPromptConsumed?: () => void;
  onCommand?: (command: string) => string | null;
};

const memoryFallback: AgentMemory = { focusAreas: [] };

export function ConversationalAgent({ projectId, mode, view, incomingPrompt, onPromptConsumed, onCommand }: ConversationalAgentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [recentTelemetry, setRecentTelemetry] = useState<AgentTelemetryEvent[]>([]);
  const [memory, setMemory] = useState<AgentMemory>(memoryFallback);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const agentMemory = useAgentMemory(true);

  const fetchContext = async () => {
    try {
      const params = new URLSearchParams({ projectId, mode, view });
      if (firstLoadRef.current) {
        params.set("resume", "1");
        firstLoadRef.current = false;
      }
      const res = await fetch(`/api/agent/context?${params.toString()}`, { method: "GET", cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load conversational context.");
      }
      const data = await res.json();
      setMessages(data.session?.messages ?? []);
      setMemory(data.session?.memory ?? memoryFallback);
      setRecentTelemetry(data.recentTelemetry ?? []);
      setBootstrapped(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load context");
    }
  };

  useEffect(() => {
    void fetchContext();
  }, [projectId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (!open && last.role === "assistant" && last.id !== lastMessageIdRef.current) {
      setHasUnread(true);
    }
    lastMessageIdRef.current = last.id;
  }, [messages, open]);

  const recentChips = useMemo(
    () => recentTelemetry.slice(0, 3).map((event) => event.event_type?.replace("uxshell_", "") ?? event.event_type),
    [recentTelemetry],
  );

  const executeAction = useCallback(
    async (action: AgentIntentAction) => {
      try {
        const res = await fetch("/api/agent/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            action,
            context: { mode, view, focusAreas: memory.focusAreas },
          }),
        });
        if (!res.ok) {
          throw new Error("Action execution failed.");
        }
        const data = await res.json();
        const delay = getActionDelay(action.type);
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          void emitTelemetry("speech_delay_applied", { projectId, action: action.type, delayMs: delay });
        }
        void emitTelemetry("ai_trust_signal", { projectId, mode, view, action: action.type });
        setMessages(data.session?.messages ?? []);
        setMemory(data.session?.memory ?? memoryFallback);
        const followup = suggestionFromAction(action.type, projectId);
        if (followup) {
          agentMemory.queueSuggestion(followup);
        }
      } catch (err: any) {
        setError(err?.message ?? "Unable to execute action.");
      }
    },
    [projectId, mode, view, memory.focusAreas, agentMemory],
  );

  const sendPrompt = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || busy) return;
      setBusy(true);
      setError(null);

      const optimistic: AgentMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: prompt,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      void emitTelemetry("agent_message_sent", { projectId, mode, view });

      const commandResponse = onCommand?.(prompt);
      if (commandResponse) {
        const ack: AgentMessage = {
          id: `command-${Date.now()}`,
          role: "assistant",
          content: commandResponse,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, ack]);
        setBusy(false);
        return;
      }

      try {
        const res = await fetch("/api/agent/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            message: prompt,
            context: {
              mode,
              view,
              recentTelemetry,
              focusAreas: memory.focusAreas,
            },
          }),
        });
        if (!res.ok) {
          throw new Error("Intent classification failed.");
        }
        const data = await res.json();
        setMessages(data.session?.messages ?? []);
        setMemory(data.session?.memory ?? memoryFallback);
        void emitTelemetry("agent_message_received", {
          projectId,
          mode,
          view,
          intent: data.intent?.id ?? "unknown",
        });
        if (data.intent?.id) {
          agentMemory.recordIntent(data.intent.id);
        }
        if (data.intent?.action) {
          await executeAction(data.intent.action);
        }
      } catch (err: any) {
        setError(err?.message ?? "Unable to route prompt.");
      } finally {
        setBusy(false);
      }
    },
    [busy, projectId, mode, view, recentTelemetry, executeAction, agentMemory, memory.focusAreas, onCommand],
  );

  useEffect(() => {
    if (!incomingPrompt) return;
    const trimmed = incomingPrompt.trim();
    if (!trimmed) return;
    setOpen(true);
    setInput("");
    void sendPrompt(trimmed);
    onPromptConsumed?.();
  }, [incomingPrompt, sendPrompt, onPromptConsumed]);

  const renderCard = (message: AgentMessage) => {
    if (!message.card) return null;
    switch (message.card.type) {
      case "roi":
        return (
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <p>Net ROI: {typeof message.card.netROI === "number" ? `${Math.round(message.card.netROI * 100)}%` : "—"}</p>
            <p>Break-even month: {message.card.breakEvenMonth ?? "—"}</p>
            <p>Total benefit: ${message.card.totalBenefit.toLocaleString()}</p>
          </div>
        );
      case "harmonization":
        return (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p>Systems: {message.card.systems}</p>
            <p>Integrations: {message.card.integrations}</p>
            <p>Domains: {message.card.domains}</p>
          </div>
        );
      case "sequence":
        return (
          <div className="mt-2 space-y-1">
            {message.card.waves.map((wave) => (
              <div key={wave.id} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{wave.title}</p>
                {wave.focus && <p>Focus: {wave.focus}</p>}
                {wave.timelineMonths && <p>Timeline: {wave.timelineMonths[0]}–{wave.timelineMonths[1]} mo</p>}
              </div>
            ))}
          </div>
        );
      case "review":
        return (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
            {message.card.highlights.map((item, idx) => (
              <li key={`${message.id}-highlight-${idx}`}>{item}</li>
            ))}
          </ul>
        );
      case "walkthrough":
        return (
          <div className="mt-2 space-y-2 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">{message.card.title}</p>
            <ol className="space-y-1 pl-4">
              {message.card.steps.map((step) => (
                <li key={step.id} className="list-decimal">
                  <span className="font-semibold">{step.title}:</span> {step.detail}
                </li>
              ))}
            </ol>
            <p className="text-slate-500">{message.card.completion}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    void sendPrompt(trimmed);
  };

  const togglePanel = () => {
    setOpen((prev) => !prev);
    setHasUnread(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={togglePanel}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
      >
        EAgent
        <span className={`h-2 w-2 rounded-full ${hasUnread ? "bg-emerald-400" : "bg-slate-400"}`} />
      </button>

      {open && (
        <div className="w-80 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Project {projectId}</p>
              <p className="text-xs text-slate-600">
                {mode} · {view}
              </p>
            </div>
            <span className={`text-[11px] font-semibold ${busy ? "text-amber-500" : "text-emerald-600"}`}>
              {busy ? "Thinking…" : "Ready"}
            </span>
          </div>

          {memory.focusAreas.length > 0 ? (
            <div className="mt-2">
              <p className="text-[0.55rem] uppercase tracking-[0.25em] text-slate-400">Focus Platforms</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {memory.focusAreas.map((area) => (
                  <span key={area} className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500">
              Tell me which platforms you are assessing (ERP, CRM, Commerce, Data) so I can filter harmonization.
            </div>
          )}

          {recentChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recentChips.map((chip, idx) => (
                <span key={`${chip}-${idx}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {chip}
                </span>
              ))}
            </div>
          )}

          <div ref={scrollRef} className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {messages.map((message) => (
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
                <div className="whitespace-pre-wrap">{message.content}</div>
                {renderCard(message)}
                {message.link && (
                  <a
                    href={message.link.href}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                  >
                    {message.link.label} →
                  </a>
                )}
              </div>
            ))}
          </div>

          {error && <p className="mt-2 text-[11px] text-rose-500">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={!bootstrapped || busy}
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!bootstrapped || busy}
              className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function suggestionFromAction(actionType: AgentIntentAction["type"], projectId: string): AgentSuggestion | null {
  switch (actionType) {
    case "graph.harmonize":
      return {
        id: `agent-sequencer-${projectId}`,
        title: "Sequence modernization next",
        summary: "Dependencies are ready—Sequencer can draft the rollout plan.",
        ctaLabel: "Open Sequencer",
        route: `/project/${projectId}/sequencer`,
        targetView: "sequencer",
        icon: "sequencer",
        source: "agent_action",
      };
    case "sequence.plan":
      return {
        id: `agent-review-${projectId}`,
        title: "Review before publishing",
        summary: "Harmonization review can approve the latest sequence.",
        ctaLabel: "Open Review",
        route: `/project/${projectId}/review`,
        targetView: "review",
        icon: "review",
        source: "agent_action",
      };
    case "roi.summary":
      return {
        id: `agent-graph-${projectId}`,
        title: "Inspect the enterprise map",
        summary: "Review the graph to validate ROI inputs and context.",
        ctaLabel: "Open Digital Enterprise",
        route: `/project/${projectId}/experience?scene=digital`,
        targetView: "graph",
        icon: "graph",
        source: "agent_action",
      };
    default:
      return null;
  }
}
