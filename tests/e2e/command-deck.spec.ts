import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D061 Command Deck", () => {
  test("loads command deck first and opens view on demand", async ({ page }) => {
    await page.goto("/project/700am/dashboard");

    await expect(page.getByText("Command Deck").first()).toBeVisible();
    await expect(page.getByText("Digital Enterprise Graph").first()).toBeVisible();
    await expect(page.locator('iframe[title="Graph"]')).toHaveCount(0);
    await expect(page.getByText(/Insights ·/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Digital Enterprise Graph/i }).first().click();
    await expect(page.getByText(/Active view/i)).toBeVisible();
    await expect(page.locator('iframe[title="Graph"]')).toHaveCount(1);

    await recordTestResult(page, "command-deck.command-deck-load", "D061");
  });
});
