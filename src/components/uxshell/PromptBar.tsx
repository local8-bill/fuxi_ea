"use client";

import { useState } from "react";
import { emitTelemetry } from "./telemetry";

interface PromptBarProps {
  onSubmit?: (prompt: string) => void;
}

export function PromptBar({ onSubmit }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt) return;
    setBusy(true);
    onSubmit?.(prompt);
    await emitTelemetry("prompt_executed", { prompt });
    setBusy(false);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        placeholder='Ask your enterprise (e.g., "Show ROI for Commerce")'
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        Ask
      </button>
    </form>
  );
}
