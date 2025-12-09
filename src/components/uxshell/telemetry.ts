export async function emitTelemetry(eventType: string, payload: Record<string, any> = {}) {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        workspace_id: "uxshell",
        ...payload,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // best-effort; ignore failures in UI shell
  }
}

import type { ExperienceScene } from "@/hooks/useExperienceFlow";

export type PromptAction = { view?: string; target?: string; scene?: ExperienceScene };

export function mapPromptToAction(prompt: string): PromptAction {
  const p = prompt.toLowerCase();
  if (p.includes("onboard") || p.includes("onboarding") || p.includes("start project")) {
    return { view: "onboarding", target: "onboarding", scene: "onboarding" };
  }
  if (p.includes("graph") || p.includes("map") || p.includes("twin")) {
    return { view: "digital", target: "digital-enterprise", scene: "digital" };
  }
  if (p.includes("roi") || p.includes("return") || p.includes("benefit")) {
    return { view: "roi", target: "roi-dashboard", scene: "roi" };
  }
  if (p.includes("sequence") || p.includes("roadmap") || p.includes("stage")) {
    return { view: "sequencer", target: "sequencer", scene: "sequencer" };
  }
  if (p.includes("review") || p.includes("harmonization") || p.includes("delta")) {
    return { view: "review", target: "harmonization-review", scene: "review" };
  }
  return {};
}
