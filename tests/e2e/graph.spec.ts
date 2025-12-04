import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Digital Enterprise graph loads", async ({ page }) => {
  await page.goto("/project/demo/digital-enterprise");

  await expect(page.getByRole("heading", { name: /Ecosystem View for Project/i })).toBeVisible();
  // Expect graph controls present (legend / filters)
  await expect(page.getByText("Edge kinds", { exact: false })).toBeVisible();

  await recordTestResult(page, "graph.spec.digital-enterprise", "D061");
});
