import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test("sidebar renders projects, views, modes with chevrons", async ({ page }) => {
  await page.goto("/project/700am/experience?scene=command");

  await expect(page.getByText(/Projects/i).first()).toBeVisible();
  await expect(page.getByText(/Views/i).first()).toBeVisible();
  await expect(page.getByText(/Modes/i).first()).toBeVisible();
  await expect(page.getByText(/Intelligence/i).first()).toBeVisible();

  await page.getByRole("button", { name: /VIEWS/i }).first().click();

  const roiToggle = page.getByRole("button", { name: /Σ ROI/i }).first();
  await expect(roiToggle).toBeVisible();
  await roiToggle.click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeVisible();

  await page.getByRole("button", { name: /Σ ROI/i }).click();
  await expect(page.getByText("ROI 1 (Hypothesis)")).toBeHidden({ timeout: 2000 });

  await recordTestResult(page, "nav.spec.sidebar");
});

test("views list follows canonical order", async ({ page }) => {
  await page.goto("/project/700am/experience?scene=command");

  await page.getByRole("button", { name: /VIEWS/i }).first().click();
  await page.getByRole("button", { name: /Σ ROI/i }).click();

  const viewItems = await page.locator('[data-testid^="view-"]').allTextContents();
  const normalized = viewItems.map((text) => text.replace(/^[Σ∞⇄✓]+/, "").trim());
  await expect(normalized).toEqual([
    "ROI 1 (Hypothesis)",
    "ROI 2 (Actuals)",
    "ROI 3 (Scenario B)",
    "+ New ROI",
    "Digital Twin",
    "Sequencer",
    "Review",
  ]);

  await recordTestResult(page, "nav.spec.canonical-views");
});

test("intelligence shortcuts route to insights panels", async ({ page }) => {
  await page.goto("/project/700am/experience?scene=command");
  await page.getByRole("button", { name: /INTELLIGENCE/i }).click();
  await page.getByTestId("intel-engagement").click();
  await expect(page).toHaveURL(/scene=insights/);
  await expect(page).toHaveURL(/focus=engagement/);
  await expect(page.getByText("User Engagement").first()).toBeVisible();

  await recordTestResult(page, "nav.spec.intelligence");
});
