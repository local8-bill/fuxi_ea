import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("sidebar renders projects, views, modes with chevrons", async ({ page }) => {
  await page.goto("/uxshell");

  await expect(page.getByText(/Projects/i).first()).toBeVisible();
  await expect(page.getByText(/Views/i).first()).toBeVisible();
  await expect(page.getByText(/Modes/i).first()).toBeVisible();

  await page.getByRole("button", { name: /VIEWS/i }).first().click();

  // Expand ROI and verify nested items are visible
  const roiToggle = page.getByRole("button", { name: /Σ ROI/i }).first();
  await expect(roiToggle).toBeVisible();
  await roiToggle.click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeVisible();

  // Collapse again to ensure toggles work
  await page.getByRole("button", { name: /Σ ROI/i }).click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeHidden({ timeout: 2000 });

  await recordTestResult(page, "nav.spec.sidebar");
});
