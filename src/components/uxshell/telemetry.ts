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
