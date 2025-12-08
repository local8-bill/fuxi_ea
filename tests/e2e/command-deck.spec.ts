import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D061 Command Deck", () => {
  test("loads command deck first and opens view on demand", async ({ page }) => {
    await page.goto("/project/700am/experience?scene=command");

    await expect(page).toHaveURL(/scene=command/);
    await expect(page.getByRole("heading", { name: /Command Deck/i })).toBeVisible();
    await expect(page.getByText(/Experience Flow/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Digital Twin" })).toBeVisible();

    await page.getByRole("button", { name: "Open Digital Twin" }).click();
    await expect(page).toHaveURL(/scene=digital/);
    await expect(page.getByText(/Digital Twin graph/i)).toBeVisible();

    await recordTestResult(page, "command-deck.command-deck-load", "D061");
  });
});
