import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("sidebar renders projects, views, modes with chevrons", async ({ page }) => {
  await page.goto("/uxshell");

  await expect(page.getByText("Projects", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Views", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Modes", { exact: true }).first()).toBeVisible();

  // Expand ROI and verify nested items are visible
  await page.getByText("ROI", { exact: true }).click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeVisible();

  // Collapse again to ensure toggles work
  await page.getByText("ROI", { exact: true }).click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeHidden({ timeout: 2000 });

  await recordTestResult(page, "nav.spec.sidebar");
});
