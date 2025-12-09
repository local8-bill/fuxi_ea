import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("Insights overview", () => {
  test("loads charts and table data", async ({ page }) => {
    await page.goto("/project/700am/experience?scene=insights");

    await expect(page.getByText(/Impact vs Effort/i)).toBeVisible();
    await expect(page.getByText(/Opportunities by Quadrant/i)).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("canvas, svg").first()).toBeVisible();

    await recordTestResult(page, "insights.page-load");
  });
});
