"use client";

import { useMemo } from "react";
import type { GraphFocus, GraphViewMode, GraphRevealStage } from "@/hooks/useGraphTelemetry";

interface GraphNarrationInput {
  focus: GraphFocus;
  focusLabel?: string | null;
  viewMode: GraphViewMode;
  stage: GraphRevealStage;
}

const stagePhrases: Record<GraphRevealStage, string> = {
  orientation: "orienting on the domains",
  exploration: "exploring the systems in this lens",
  connectivity: "surfacing the high-traffic paths",
  insight: "overlaying ROI and TCC signals",
};

const focusPhrases: Record<GraphFocus, string> = {
  domain: "highlighting the busiest domains",
  goal: "prioritizing goal-driven systems",
  stage: "sequencing the current wave",
};

const viewModePhrases: Record<GraphViewMode, string> = {
  systems: "systems",
  domain: "value streams",
  roi: "ROI overlays",
  sequencer: "sequencer readiness",
  capabilities: "capability coverage",
};

export function useGraphNarration({ focus, focusLabel, viewMode, stage }: GraphNarrationInput) {
  return useMemo(() => {
    const stageText = stagePhrases[stage];
    const focusText = focusPhrases[focus];
    const label = focusLabel ? ` — ${focusLabel}` : "";
    const viewText = viewModePhrases[viewMode];
    return `I’m ${stageText} with ${focusText}${label}. ${viewText} view active.`;
  }, [focus, focusLabel, viewMode, stage]);
}
