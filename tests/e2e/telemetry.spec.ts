import { test, expect } from "@playwright/test";

const postTelemetry = (request: import("@playwright/test").APIRequestContext, data: Record<string, any>) =>
  request.post("/api/telemetry", {
    data: {
      session_id: "test-session",
      workspace_id: "uxshell",
      event_type: "conversation_intent",
      data,
    },
  });

test.describe("Demo telemetry aggregates", () => {
  test("GET /api/telemetry/demo returns performance metrics", async ({ request }) => {
    await postTelemetry(request, { intent: "roi_summary", tone: "formal" });
    await request.post("/api/telemetry", {
      data: {
        session_id: "test-session",
        workspace_id: "uxshell",
        event_type: "speech_delay_applied",
        data: { delayMs: 1800 },
      },
    });

    const res = await request.get("/api/telemetry/demo");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tonePerformance.totalMessages).toBeGreaterThan(0);
    expect(json.conversationBehavior.intentCounts).toBeDefined();
  });
});
