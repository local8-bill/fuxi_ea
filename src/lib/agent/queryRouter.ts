"use client";

import type { ExperienceScene } from "@/hooks/useExperienceFlow";
import { mapPromptToAction } from "@/components/uxshell/telemetry";

export type QueryRoute =
  | { target: "search"; query: string }
  | { target: "contextual"; scene?: ExperienceScene; action?: { view?: string; target?: string }; prompt: string }
  | { target: "agent"; prompt: string };

type QueryContext = {
  projectId: string;
  scene: ExperienceScene;
  mode: string;
};

const SEARCH_KEYWORDS = ["search", "find", "lookup", "locate"];

export function routeQuery(prompt: string, _context: QueryContext): QueryRoute {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { target: "agent", prompt: "" };
  }

  const lower = trimmed.toLowerCase();
  if (SEARCH_KEYWORDS.some((keyword) => lower.startsWith(`${keyword} `))) {
    return { target: "search", query: trimmed.replace(/^(search|find|lookup|locate)\s+/i, "") };
  }

  const action = mapPromptToAction(trimmed);
  if (action.scene || action.view || action.target) {
    return { target: "contextual", scene: action.scene, action, prompt: trimmed };
  }

  return { target: "agent", prompt: trimmed };
}
