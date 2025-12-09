import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D075 Anticipatory Interaction", () => {
  test("renders preview after idle and routes with context", async ({ page }) => {
    await page.goto("/project/700am/experience?scene=command");
    await page.waitForTimeout(1000);
    const roiCard = page.getByText("Run ROI Scenario");
    await expect(roiCard).toBeVisible();
    await page.getByRole("button", { name: "Open ROI" }).click();
    await expect(page).toHaveURL(/scene=roi/);
    await expect(page.getByRole("heading", { name: /ROI Dashboard/i })).toBeVisible();
    await recordTestResult(page, "anticipatory-preview.roi", "D075");
  });
});
