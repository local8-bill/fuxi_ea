"use client";

import { useCallback } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";

export type GraphFocus = "domain" | "goal" | "stage";
export type GraphViewMode = "systems" | "domain" | "roi" | "sequencer" | "capabilities";
export type GraphRevealStage = "orientation" | "exploration" | "connectivity" | "insight";

export function useGraphTelemetry(projectId?: string) {
  const { log } = useTelemetry("digital_twin_graph", { projectId });

  const trackFocus = useCallback((focus: GraphFocus, detail?: Record<string, unknown>) => {
    log("graph_focus_changed", { focus, ...detail });
  }, [log]);

  const trackMode = useCallback((mode: GraphViewMode) => {
    log("graph_mode_changed", { mode });
  }, [log]);

  const trackStage = useCallback((stage: GraphRevealStage) => {
    log("graph_stage_revealed", { stage });
  }, [log]);

  const trackInteraction = useCallback((kind: string, payload?: Record<string, unknown>) => {
    log("graph_interaction", { kind, ...payload });
  }, [log]);

  return { trackFocus, trackMode, trackStage, trackInteraction };
}
