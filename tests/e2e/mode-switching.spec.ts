import { test, expect } from "@playwright/test";

test.describe("D079 Mode Switcher", () => {
  test("switches between modes via browser bridge", async ({ page }) => {
    await page.goto("/project/700am/experience?scene=command");
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(() => Boolean(window.FuxiModeSwitcher));

    const initialMode = await page.evaluate(() => window.FuxiModeSwitcher?.getCurrentMode());
    expect(initialMode).toBeDefined();

    await page.evaluate(() => window.FuxiModeSwitcher?.switchMode("founder"));
    const founderMode = await page.evaluate(() => window.FuxiModeSwitcher?.getCurrentMode());
    expect(founderMode).toBe("founder");

    await page.evaluate(() => window.FuxiModeSwitcher?.switchMode("demo"));
    const demoMode = await page.evaluate(() => window.FuxiModeSwitcher?.getCurrentMode());
    expect(demoMode).toBe("demo");
  });
});
