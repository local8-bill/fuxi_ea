"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { emitTelemetry } from "@/components/uxshell/telemetry";

type ViewKey = "graph" | "roi" | "sequencer" | "review";

export type AgentSuggestion = {
  id: string;
  title: string;
  summary: string;
  ctaLabel: string;
  route: string;
  targetView: ViewKey;
  icon?: ViewKey;
  source?: string;
  createdAt?: number;
};

type AgentMemoryState = {
  projectId: string;
  intents: string[];
  lastView?: string;
  suggestions: AgentSuggestion[];
  lastAccepted?: string;
};

type AgentMemoryContextValue = {
  projectId: string;
  state: AgentMemoryState;
  topbarCue: ViewKey | null;
  recordIntent(intentId: string): void;
  recordView(view: ViewKey): void;
  queueSuggestion(suggestion: AgentSuggestion): void;
  dismissSuggestion(id: string, reason?: string): void;
  acceptSuggestion(id: string): AgentSuggestion | null;
  clearAllSuggestions(): void;
};

const STORAGE_PREFIX = "uxshell:agent-memory:";

const noopContext: AgentMemoryContextValue = {
  projectId: "unknown",
  state: { projectId: "unknown", intents: [], suggestions: [] },
  topbarCue: null,
  recordIntent: () => {},
  recordView: () => {},
  queueSuggestion: () => {},
  dismissSuggestion: () => {},
  acceptSuggestion: () => null,
  clearAllSuggestions: () => {},
};

const AgentMemoryContext = createContext<AgentMemoryContextValue | null>(null);

function loadSnapshot(projectId: string): AgentMemoryState {
  if (typeof window === "undefined") return { projectId, intents: [], suggestions: [] };
  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { projectId, intents: [], suggestions: [] };
    const parsed = JSON.parse(raw) as AgentMemoryState;
    return {
      projectId,
      intents: parsed?.intents ?? [],
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed.suggestions.map((s) => ({
            ...s,
            createdAt: typeof s.createdAt === "number" ? s.createdAt : undefined,
          }))
        : [],
      lastView: parsed?.lastView,
      lastAccepted: parsed?.lastAccepted,
    };
  } catch {
    return { projectId, intents: [], suggestions: [] };
  }
}

function persistSnapshot(projectId: string, snapshot: AgentMemoryState) {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${projectId}`;
  window.localStorage.setItem(key, JSON.stringify(snapshot));
}

export function AgentMemoryProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  const [state, setState] = useState<AgentMemoryState>(() => ({
    projectId,
    intents: [],
    suggestions: [],
  }));
  const [topbarCue, setTopbarCue] = useState<ViewKey | null>(null);
  const persistRef = useRef(false);

  useEffect(() => {
    const snapshot = loadSnapshot(projectId);
    persistRef.current = false;
    setState(snapshot);
  }, [projectId]);

  useEffect(() => {
    if (persistRef.current) {
      persistSnapshot(projectId, state);
    } else {
      persistRef.current = true;
    }
  }, [state, projectId]);

  useEffect(() => {
    const nextCue = state.suggestions[0]?.icon ?? null;
    setTopbarCue(nextCue ?? null);
  }, [state.suggestions]);

  const recordIntent = useCallback(
    (intentId: string) => {
      setState((prev) => {
        const intents = [intentId, ...prev.intents.filter((id) => id !== intentId)].slice(0, 5);
        return { ...prev, intents };
      });
    },
    [setState],
  );

  const recordView = useCallback(
    (view: ViewKey) => {
      setState((prev) => ({ ...prev, lastView: view }));
    },
    [setState],
  );

  const queueSuggestion = useCallback(
    (suggestion: AgentSuggestion) => {
      setState((prev) => {
        if (prev.suggestions.some((s) => s.id === suggestion.id || s.targetView === suggestion.targetView)) {
          return prev;
        }
        const trimmed = prev.suggestions.length >= 3 ? prev.suggestions.slice(0, 2) : prev.suggestions;
        const enriched: AgentSuggestion = {
          ...suggestion,
          id: suggestion.id || uuidv4(),
          createdAt: Date.now(),
        };
        const next = [enriched, ...trimmed];
        const telemetryPayload = {
          projectId,
          anticipation_id: enriched.id,
          suggestionId: enriched.id,
          targetView: enriched.targetView,
          context_route: enriched.route,
          source: enriched.source,
          data: {
            target_view: enriched.targetView,
            source: enriched.source,
          },
        };
        void emitTelemetry("anticipation_triggered", {
          ...telemetryPayload,
        });
        void emitTelemetry("preview_opened", {
          ...telemetryPayload,
        });
        return { ...prev, suggestions: next };
      });
    },
    [projectId],
  );

  const dismissSuggestion = useCallback(
    (id: string, reason?: string) => {
      let dismissed: AgentSuggestion | null = null;
      setState((prev) => {
        dismissed = prev.suggestions.find((s) => s.id === id) ?? null;
        const suggestions = prev.suggestions.filter((s) => s.id !== id);
        return { ...prev, suggestions };
      });
      const timeToAction = dismissed?.createdAt ? Date.now() - dismissed.createdAt : undefined;
      void emitTelemetry("preview_dismissed", {
        projectId,
        anticipation_id: id,
        suggestionId: id,
        targetView: dismissed?.targetView,
        context_route: dismissed?.route,
        time_to_action: timeToAction,
        reason,
        data: {
          target_view: dismissed?.targetView,
          reason,
        },
      });
    },
    [projectId],
  );

  const acceptSuggestion = useCallback(
    (id: string) => {
      let accepted: AgentSuggestion | null = null;
      setState((prev) => {
        const found = prev.suggestions.find((s) => s.id === id) ?? null;
        accepted = found;
        const suggestions = prev.suggestions.filter((s) => s.id !== id);
        return { ...prev, suggestions, lastAccepted: id };
      });
      if (accepted) {
        const timeToAction = accepted.createdAt ? Date.now() - accepted.createdAt : undefined;
        void emitTelemetry("next_step_accepted", {
          projectId,
          anticipation_id: id,
          suggestionId: id,
          route: accepted.route,
          targetView: accepted.targetView,
          context_route: accepted.route,
          time_to_action: timeToAction,
          data: {
            target_view: accepted.targetView,
          },
        });
      }
      return accepted;
    },
    [projectId],
  );

  const clearAllSuggestions = useCallback(() => {
    setState((prev) => ({ ...prev, suggestions: [] }));
  }, []);

  const value = useMemo<AgentMemoryContextValue>(
    () => ({
      projectId,
      state,
      topbarCue,
      recordIntent,
      recordView,
      queueSuggestion,
      dismissSuggestion,
      acceptSuggestion,
      clearAllSuggestions,
    }),
    [projectId, state, topbarCue, recordIntent, recordView, queueSuggestion, dismissSuggestion, acceptSuggestion, clearAllSuggestions],
  );

  return <AgentMemoryContext.Provider value={value}>{children}</AgentMemoryContext.Provider>;
}

export function useAgentMemory(optional = false): AgentMemoryContextValue {
  const ctx = useContext(AgentMemoryContext);
  if (!ctx) {
    if (optional) return noopContext;
    throw new Error("useAgentMemory must be used within AgentMemoryProvider");
  }
  return ctx;
}
