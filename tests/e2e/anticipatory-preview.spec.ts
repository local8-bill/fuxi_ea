import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D075 Anticipatory Interaction", () => {
  test("renders preview after idle and routes with context", async ({ page }) => {
    await page.goto("/project/700am/dashboard");
    await page.waitForTimeout(2800);
    await expect(page.getByText("Model ROI next")).toBeVisible();
    await page.getByRole("button", { name: "Open ROI Dashboard" }).click();
    await expect(page.getByText("Model ROI next")).toBeHidden();
    await recordTestResult(page, "anticipatory-preview.roi", "D075");
  });
});
