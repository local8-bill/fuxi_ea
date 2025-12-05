"use client";

import { useEffect, useMemo, useState } from "react";
import { emitTelemetry } from "./telemetry";

type Message = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  waves?: Array<{ id: string; title: string; focus?: string; timelineMonths?: [number, number] }>;
  link?: { label: string; href: string };
};

const toneProfile = {
  harmonize: "Kicking off harmonization and keeping the view calm while we load results…",
  sequence: "Generating a 3-wave modernization plan tailored to your data…",
  roi: "Preparing your ROI snapshot with break-even and net ROI…",
  export: "Exporting the roadmap JSON and wrapping up this session.",
  fallback: "On it—I'll route that request through the assistant stack.",
};

const waitForVisualCalm = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export function ChatPane({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const contextNote = useMemo(
    () => `Project ${projectId} · UXShell assistant stub`,
    [projectId],
  );

  useEffect(() => {
    const key = `uxshell_chat_${projectId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setMessages([
      {
        role: "assistant",
        content: "Hi there! Ask anything about your graph, ROI, or sequencer. This is a local stub response.",
        ts: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    const key = `uxshell_chat_${projectId}`;
    try {
      localStorage.setItem(key, JSON.stringify(messages.slice(-50)));
    } catch {
      // ignore quota errors
    }
  }, [messages, projectId]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const userMsg: Message = { role: "user", content: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);
    void emitTelemetry("chat_message_sent", { projectId, length: trimmed.length });

    void handleIntent(trimmed.toLowerCase(), trimmed);
  };

  const pushReply = (content: string, extra?: Partial<Message>) => {
    const reply: Message = { role: "assistant", content, ts: Date.now(), ...extra };
    setMessages((prev) => [...prev, reply]);
  };

  const handleIntent = async (lower: string, original: string) => {
    try {
      if (lower.includes("harmoniz") || lower.includes("graph")) {
        pushReply(toneProfile.harmonize);
        const res = await fetch("/api/harmonization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        const data = await res.json();
        await waitForVisualCalm();
        pushReply(
          `Harmonization completed. Systems: ${data.summary?.systems ?? "?"}, Integrations: ${
            data.summary?.integrations ?? "?"
          }, Domains: ${data.summary?.domains ?? "?"}. Opening Digital Enterprise view.`,
        );
        if (data?.transitionUrl) {
          pushReply("Open Digital Enterprise view", {
            link: { label: "Digital Enterprise", href: data.transitionUrl },
          });
        }
        void emitTelemetry("harmonization_completed", { projectId, summary: data.summary });
      } else if (lower.includes("sequence") || lower.includes("roadmap") || lower.includes("plan")) {
        pushReply(toneProfile.sequence);
        const res = await fetch("/api/sequence/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, strategy: "value" }),
        });
        const data = await res.json();
        const waves: Array<any> = data.waves ?? [];
        const summary = waves
          .map((w: any) => {
            const timeline = Array.isArray(w.timelineMonths) ? w.timelineMonths.join("–") : "tbd";
            return `${w.title} (${timeline} mo)`;
          })
          .join("; ");
        await waitForVisualCalm();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sequencing generated: ${summary}`,
            ts: Date.now(),
            waves,
          },
        ]);
        void emitTelemetry("sequencing_generated", { projectId, strategy: "value" });
      } else if (lower.includes("roi")) {
        pushReply(toneProfile.roi);
        const res = await fetch(`/api/roi/forecast?project=${encodeURIComponent(projectId)}`);
        const data = await res.json();
        const netROI = data?.predictions?.netROI ?? data?.predictions?.roi ?? "—";
        await waitForVisualCalm();
        pushReply(
          `ROI summary: net ROI ${Math.round((netROI || 0) * 100)}%, break-even month ${
            data?.predictions?.breakEvenMonth ?? "?"
          }.`,
        );
        pushReply("Open ROI dashboard", { link: { label: "ROI Dashboard", href: `/project/${projectId}/roi-dashboard` } });
        void emitTelemetry("roi_summary_displayed", {
          projectId,
          netROI,
          breakEvenMonth: data?.predictions?.breakEvenMonth,
        });
      } else if (lower.includes("export") || lower.includes("json")) {
        pushReply(toneProfile.export);
        await waitForVisualCalm();
        void emitTelemetry("session_completed", { projectId });
      } else {
        pushReply(`${toneProfile.fallback} Request: "${original}". Context: ${contextNote}.`);
      }
    } catch (err: any) {
      pushReply(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setPending(false);
      void emitTelemetry("chat_response_received", { projectId, ok: true });
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Assistant</p>
        <span className="text-xs text-slate-500">Stubbed · local only</span>
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
        {messages.map((m, idx) => (
          <div
            key={`${m.ts}-${idx}`}
            className={`max-w-xl rounded-xl px-3 py-2 text-sm ${
              m.role === "assistant"
                ? "bg-white text-slate-800 border border-slate-200 shadow-sm"
                : "bg-slate-900 text-white ml-auto"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.waves && m.waves.length > 0 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {m.waves.map((w) => (
                  <div key={w.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-700">{w.title}</p>
                    {w.focus && <p className="text-xs text-slate-500">Focus: {w.focus}</p>}
                    {w.timelineMonths && (
                      <p className="text-[11px] text-slate-500">
                        Timeline: {w.timelineMonths[0]}–{w.timelineMonths[1]} months
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {m.link && (
              <a
                href={m.link.href}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                {m.link.label}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="Ask anything about your enterprise…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={sendMessage}
          disabled={pending}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
