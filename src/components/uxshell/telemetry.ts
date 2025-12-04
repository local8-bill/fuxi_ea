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

export function mapPromptToAction(prompt: string): { view?: string; target?: string } {
  const p = prompt.toLowerCase();
  if (p.includes("graph") || p.includes("map")) return { view: "graph", target: "digital-enterprise" };
  if (p.includes("roi") || p.includes("return") || p.includes("benefit")) return { view: "roi", target: "roi-dashboard" };
  if (p.includes("sequence") || p.includes("roadmap") || p.includes("stage")) return { view: "sequencer", target: "transformation-dialogue" };
  if (p.includes("review") || p.includes("harmonization") || p.includes("delta")) return { view: "review", target: "harmonization-review" };
  return {};
}
