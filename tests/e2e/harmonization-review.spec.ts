import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("Harmonization review loads with metrics and confirm action", async ({ page }) => {
  await page.goto("/project/demo/harmonization-review");

  await expect(page.getByText(/Harmonization Review/i).first()).toBeVisible();
  await expect(page.getByText(/Validate the harmonized ecosystem/i)).toBeVisible();

  await expect(page.getByText("Systems found", { exact: false })).toBeVisible();
  await expect(page.getByText("Integrations", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Domains detected", { exact: true }).last()).toBeVisible();

  await expect(page.getByRole("button", { name: /Confirm harmonization/i })).toBeVisible();

  await recordTestResult(page, "harmonization-review.metrics-and-confirm", "D068");
});
