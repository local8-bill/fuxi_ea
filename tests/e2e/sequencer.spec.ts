import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Transformation Dialogue loads", async ({ page }) => {
  await page.goto("/project/demo/transformation-dialogue");

  await expect(page.getByText(/Transformation Dialogue/i).first()).toBeVisible({ timeout: 5000 });

  await recordTestResult(page, "sequencer.spec.transformation-dialogue", "D061");
});
