"use client";

import { useState } from "react";
import { emitTelemetry } from "./telemetry";

const roles = ["Architect", "Analyst", "CFO", "FP&A", "CIO"] as const;

interface ModeSelectorProps {
  onChange?: (role: string) => void;
}

export function ModeSelector({ onChange }: ModeSelectorProps) {
  const [active, setActive] = useState<string>(roles[0]);

  const handleChange = (role: string) => {
    setActive(role);
    onChange?.(role);
    void emitTelemetry("ux_mode_changed", { role });
  };

  return (
    <div className="space-y-2">
      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Modes</p>
      <div className="flex flex-col gap-2">
        {roles.map((r) => {
          const activeCls =
            r === active
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50";
          return (
            <button
              key={r}
              onClick={() => handleChange(r)}
              className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold text-left transition ${activeCls}`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
