"use client";

import React from "react";
import type { ConnectionSuggestion } from "@/domain/services/connectionInference";

export type ConnectionDecision = {
  decision: "confirmed" | "rejected";
  reason?: string;
};

type Options = {
  threshold?: number;
  limit?: number;
};

export function useConnectionConfirmation(
  suggestions: ConnectionSuggestion[],
  opts?: Options,
) {
  const limit = opts?.limit ?? 10;
  const [threshold, setThreshold] = React.useState<number>(opts?.threshold ?? 0.7);
  const [decisions, setDecisions] = React.useState<Record<string, ConnectionDecision>>({});
  const [rationale, setRationale] = React.useState<Record<string, string>>({});
  const undoStack = React.useRef<string[]>([]);

  const filtered = React.useMemo(
    () =>
      suggestions
        .filter((s) => s.confidence >= threshold)
        .sort((a, b) => b.confidence - a.confidence),
    [suggestions, threshold],
  );

  const visible = React.useMemo(
    () => filtered.filter((s) => !decisions[s.id]).slice(0, limit),
    [filtered, decisions, limit],
  );

  const focus = visible[0] ?? null;

  const setDecision = (id: string, decision: ConnectionDecision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    undoStack.current.push(id);
  };

  const setReason = (id: string, text: string) => {
    setRationale((prev) => ({ ...prev, [id]: text }));
  };

  const undo = () => {
    const last = undoStack.current.pop();
    if (!last) return;
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[last];
      return next;
    });
  };

  return {
    threshold,
    setThreshold,
    decisions,
    rationale,
    setDecision,
    setReason,
    undo,
    focus,
    visible,
    filteredCount: filtered.length,
  };
}
