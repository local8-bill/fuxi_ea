import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Digital Twin guided flow produces insight and telemetry", async ({ page }) => {
  const telemetryEvents = new Set<string>();

  await page.route("**/api/telemetry", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      try {
        const payload = JSON.parse(request.postData() ?? "{}");
        if (payload?.event_type?.startsWith("digital_twin")) {
          telemetryEvents.add(payload.event_type);
        }
      } catch {
        // ignore parsing issues
      }
    }
    await route.continue();
  });

  await page.goto("/project/700am/experience?scene=digital");

  await expect(page.getByText("Guided focus", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Commerce|Finance|Supply Chain/i }).first().click();

  await expect(page.getByText(/Pick the system/i)).toBeVisible();
  await page.getByRole("button", { name: /Connections:/i }).first().click();

  await expect(page.getByText(/Select the integration/i)).toBeVisible();
  await page.getByRole("button", { name: /Integration focus/i }).first().click();

  await expect(page.getByRole("button", { name: /Open Redundancy Map/i })).toBeVisible();

  await expect.poll(() => telemetryEvents.has("digital_twin.focus_selected")).toBeTruthy();
  await expect.poll(() => telemetryEvents.has("digital_twin.insight_generated")).toBeTruthy();
  await expect.poll(() => telemetryEvents.has("digital_twin.transition_complete")).toBeTruthy();

  await recordTestResult(page, "digital-twin.flow.v0.2", "D070B");
});
