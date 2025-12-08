import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Harmonization review loads with metrics and confirm action", async ({ page }) => {
  await page.goto("/project/demo/experience?scene=review");

  await expect(page.getByText(/Harmonization Review/i).first()).toBeVisible();
  await expect(page.getByText(/Review harmonized graph deltas/i)).toBeVisible();
  await expect(page.getByText(/Review embed placeholder/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open full view/i }).first()).toBeVisible();

  await recordTestResult(page, "harmonization-review.metrics-and-confirm", "D068");
});
