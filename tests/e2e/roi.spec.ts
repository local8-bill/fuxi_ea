import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("ROI dashboard shows summary and TCC card", async ({ page }) => {
  await page.goto("/project/demo/roi-dashboard");

  await expect(page.getByText("ROI Summary")).toBeVisible();
  await expect(page.getByText("Total Cost of Change")).toBeVisible();
  await expect(page.getByText("Break-even", { exact: false })).toBeVisible();

  // Ensure forecast JSON fields rendered
  const netRoi = page.getByText("%", { exact: false }).first();
  await expect(netRoi).toBeVisible();

  await recordTestResult(page, "roi.spec.dashboard");
});
