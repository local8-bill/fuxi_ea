import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

const gotoOnboarding = async (page: import("@playwright/test").Page) => {
  await page.goto("/project/700am/experience?scene=onboarding");
  await expect(page.getByText(/Experience Flow/i)).toBeVisible();
  await expect(page.getByText(/Guided Onboarding/i)).toBeVisible();
};

test.describe("D062 Conversational Onboarding", () => {
  test("collects context and upload prompt stays inline", async ({ page }) => {
    await gotoOnboarding(page);

    await expect(page.getByLabel("Project name", { exact: false })).toHaveValue("700am");
    await page.getByLabel("Role", { exact: false }).selectOption("Analyst");
    await page.getByLabel("Goal", { exact: false }).selectOption("ROI");
    await page.getByLabel("Pace", { exact: false }).selectOption("Accelerated");

    await expect(page.getByText(/Upload artifacts/i)).toBeVisible();
    await expect(page.getByText(/Recent guidance/i)).toBeVisible();

    await recordTestResult(page, "onboarding.form-load", "D062");
  });

  test("auto-proceed toggle updates activity log", async ({ page }) => {
    await gotoOnboarding(page);

    await page.setInputFiles('input[type="file"]', {
      name: "inventory.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("system,owner\nERP,Ops"),
    });

    const toggle = page.getByLabel(/Auto-proceed after future uploads/i);
    await toggle.check();
    await expect(page.getByText(/Auto-proceed enabled/i).first()).toBeVisible();
    await toggle.uncheck();
    await expect(page.getByText(/Auto-proceed disabled/i).first()).toBeVisible();

    await recordTestResult(page, "onboarding.auto-proceed-toggle", "D062");
  });
});
