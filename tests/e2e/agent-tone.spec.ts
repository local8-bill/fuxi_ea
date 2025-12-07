import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

const openAgentPanel = async (page: import("@playwright/test").Page) => {
  const toggle = page.getByRole("button", { name: /Conversational Agent/i });
  const isVisible = await toggle.isVisible();
  if (!isVisible) return;
  await toggle.click();
};

test.describe("D069A Adaptive Voice Layer", () => {
  test("tone profile shifts to formal for ROI phrasing", async ({ page }) => {
    await page.goto("/project/700am/dashboard");
    await openAgentPanel(page);

    const intentResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/agent/intent") && response.request().method() === "POST",
    );

    await page.getByPlaceholder("Ask anything…").fill("Please share ROI details for Finance.");
    await page.getByRole("button", { name: "Send" }).click();

    const intentResponse = await intentResponsePromise;
    const json = await intentResponse.json();
    expect(json?.session?.memory?.toneProfile?.formality).toBe("formal");

    await recordTestResult(page, "agent-tone.formal-shift", "D069A");
  });

  test("speech delay telemetry fires for harmonization", async ({ page }) => {
    await page.goto("/project/700am/dashboard");
    await openAgentPanel(page);

    const telemetryPromise = page.waitForResponse(async (response) => {
      if (!response.url().includes("/api/telemetry")) return false;
      try {
        const payload = await response.request().postDataJSON();
        return payload?.event_type === "speech_delay_applied";
      } catch {
        return false;
      }
    });

    await page.getByPlaceholder("Ask anything…").fill("Harmonize the enterprise graph for ERP and Finance");
    await page.getByRole("button", { name: "Send" }).click();

    const telemetryResponse = await telemetryPromise;
    const payload = await telemetryResponse.request().postDataJSON();
    expect(payload.delayMs ?? payload.data?.delayMs ?? 0).toBeGreaterThanOrEqual(1500);

    await recordTestResult(page, "agent-tone.speech-delay", "D069A");
  });
});
