import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("root redirects to home", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText(/Welcome/i)).toBeVisible();
  await recordTestResult(page, "root.redirect.home");
});
