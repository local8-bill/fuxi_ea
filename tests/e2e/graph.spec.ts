import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Digital Enterprise graph loads", async ({ page }) => {
  await page.goto("/project/demo/experience?scene=digital");

  await expect(page.getByText(/Digital Twin graph/i)).toBeVisible();
  await expect(page.locator("canvas, svg").first()).toBeVisible();

  await recordTestResult(page, "graph.spec.digital-enterprise", "D061");
});
