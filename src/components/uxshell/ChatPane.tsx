"use client";

import { useEffect, useMemo, useState } from "react";
import { emitTelemetry } from "./telemetry";

type Message = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export function ChatPane({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const contextNote = useMemo(
    () => `Project ${projectId} · UXShell assistant stub`,
    [projectId],
  );

  useEffect(() => {
    // seed a welcome message
    setMessages([
      {
        role: "assistant",
        content: "Hi there! Ask anything about your graph, ROI, or sequencer. This is a local stub response.",
        ts: Date.now(),
      },
    ]);
  }, []);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const userMsg: Message = { role: "user", content: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);
    void emitTelemetry("chat_message_sent", { projectId, length: trimmed.length });

    // stubbed assistant reply
    setTimeout(() => {
      const reply: Message = {
        role: "assistant",
        content: `Stub reply for "${trimmed}". Context: ${contextNote}.`,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setPending(false);
      void emitTelemetry("chat_response_received", { projectId, ok: true });
    }, 450);
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
            {m.content}
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
