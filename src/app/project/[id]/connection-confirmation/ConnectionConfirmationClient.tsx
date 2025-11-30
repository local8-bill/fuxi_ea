"use client";

import React from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { HarmonizedSystem } from "@/domain/services/harmonization";
import type { ConnectionSuggestion } from "@/domain/services/connectionInference";

type Props = {
  projectId: string;
  suggestions: ConnectionSuggestion[];
  nodes: HarmonizedSystem[];
};

type Decision = {
  decision: "confirmed" | "rejected";
  reason?: string;
};

export default function ConnectionConfirmationClient({ projectId, suggestions, nodes }: Props) {
  const { log } = useTelemetry("connection_confirmation", { projectId });
  const [threshold, setThreshold] = React.useState<number>(0.7);
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>({});
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const visible = React.useMemo(() => {
    return suggestions
      .filter((s) => s.confidence >= threshold)
      .filter((s) => !decisions[s.id])
      .slice(0, 10);
  }, [suggestions, threshold, decisions]);

  React.useEffect(() => {
    log("connection_inferred", {
      total_suggestions: suggestions.length,
      threshold,
      visible: visible.length,
    });
  }, [suggestions.length, threshold, visible.length, log]);

  const handleThreshold = (value: number) => {
    setThreshold(value);
    log("connection_threshold_changed", { threshold: value, visible: visible.length });
  };

  const getLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  const updateDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;
    const payload = {
      source: suggestion.source,
      target: suggestion.target,
      confidence: suggestion.confidence,
      decision: decision.decision,
      reason: decision.reason,
    };
    const event = decision.decision === "confirmed" ? "connection_confirmed" : "connection_rejected";
    log(event, payload);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = Object.entries(decisions).map(([id, d]) => {
        const sug = suggestions.find((s) => s.id === id);
        return {
          id,
          decision: d.decision,
          reason: d.reason ?? "",
          source: sug?.source ?? "",
          target: sug?.target ?? "",
          confidence: sug?.confidence ?? 0,
        };
      });
      const res = await fetch("/api/connections/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, decisions: payload }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to persist decisions");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to persist decisions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Connection Confirmation</p>
        <h1 className="text-2xl font-bold text-slate-900">Review AI-suggested connections</h1>
        <p className="mt-2 text-slate-600">
          Bounded to 10 suggestions at a time. Adjust confidence to see more or fewer recommendations.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Confidence threshold: {threshold.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.5}
          max={0.9}
          step={0.05}
          value={threshold}
          onChange={(e) => handleThreshold(Number(e.target.value))}
          className="w-64"
        />
        <span className="text-xs text-slate-600">Showing {visible.length} / {suggestions.length} (top 10 bounded)</span>
      </div>

      {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="space-y-3">
        {visible.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">
                  {getLabel(s.source)} → {getLabel(s.target)}
                </div>
                <div className="text-xs text-slate-600">
                  Confidence: {s.confidence.toFixed(2)} · {s.reason}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => updateDecision(s.id, { decision: "confirmed" })}
                >
                  Confirm
                </button>
                <button
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => updateDecision(s.id, { decision: "rejected" })}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            No suggestions at this threshold. Lower the slider to see more.
          </div>
        )}
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(decisions).length === 0}
          className={
            "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 " +
            (saving || Object.keys(decisions).length === 0 ? "opacity-60 cursor-not-allowed" : "")
          }
        >
          {saving ? "Saving..." : "Save decisions"}
        </button>
        <span className="text-xs text-slate-600">
          Decisions persisted locally; confirmed connections will feed Digital Enterprise.
        </span>
      </footer>
    </div>
  );
}
