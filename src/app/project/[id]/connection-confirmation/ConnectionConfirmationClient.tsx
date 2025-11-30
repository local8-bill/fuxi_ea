"use client";

import React from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useConnectionConfirmation } from "@/hooks/useConnectionConfirmation";
import type { HarmonizedSystem } from "@/domain/services/harmonization";
import type { ConnectionSuggestion } from "@/domain/services/connectionInference";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { useProjectState } from "@/hooks/useProjectState";

type Props = {
  projectId: string;
  suggestions: ConnectionSuggestion[];
  nodes: HarmonizedSystem[];
};

export default function ConnectionConfirmationClient({ projectId, suggestions, nodes }: Props) {
  const { log } = useTelemetry("connection_confirmation", { projectId });
  const { markComplete } = useProjectState(projectId, "connections");
  const {
    threshold,
    setThreshold,
    decisions,
    rationale,
    setDecision,
    setReason,
    undo,
    focus,
    visible,
    filteredCount,
  } = useConnectionConfirmation(suggestions, { threshold: 0.7, limit: 10 });
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const getLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  React.useEffect(() => {
    // emit per suggestion inference telemetry (bounded to avoid huge volume)
    visible.forEach((s) => {
      log("connection_inferred", {
        source: s.source,
        target: s.target,
        confidence: s.confidence,
        reason: s.reason,
      });
    });
  }, [visible, log]);

  const handleThreshold = (value: number) => {
    setThreshold(value);
    log("connection_threshold_changed", { threshold: value, visible: visible.length });
  };

  const updateDecision = (id: string, decision: "confirmed" | "rejected") => {
    const reason = rationale[id];
    setDecision(id, { decision, reason });
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;
    const payload = {
      source: suggestion.source,
      target: suggestion.target,
      confidence: suggestion.confidence,
      decision,
      reason,
    };
    const event = decision === "confirmed" ? "connection_confirmed" : "connection_rejected";
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
      markComplete();
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
        <span className="text-xs text-slate-600">
          Showing {visible.length} / {filteredCount} (top 10 bounded)
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          {focus ? (
            <ConnectionPanel
              suggestion={focus}
              sourceLabel={getLabel(focus.source)}
              targetLabel={getLabel(focus.target)}
              onConfirm={() => updateDecision(focus.id, "confirmed")}
              onReject={() => updateDecision(focus.id, "rejected")}
              onReasonChange={(text) => setReason(focus.id, text)}
              reason={rationale[focus.id]}
            />
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              No suggestions at this threshold. Lower the slider to see more.
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">Tip</div>
            <p>
              Confirm/reject updates the confidence model; rationale helps explain decisions and can be revisited via undo.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Queue</div>
            <button
              className="text-xs font-semibold text-slate-700 hover:underline"
              onClick={undo}
              disabled={Object.keys(decisions).length === 0}
            >
              Undo
            </button>
          </div>
          <div className="space-y-2 max-h-[480px] overflow-auto">
            {visible.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900">
                  {getLabel(s.source)} → {getLabel(s.target)}
                </div>
                <div className="text-[11px] text-slate-600">
                  {s.reason} · {s.confidence.toFixed(2)}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => updateDecision(s.id, "confirmed")}
                  >
                    Confirm
                  </button>
                  <button
                    className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => updateDecision(s.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="text-xs text-slate-600">Queue empty at this threshold.</div>
            )}
          </div>
        </div>
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
