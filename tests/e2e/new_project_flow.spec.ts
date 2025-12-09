import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D080 New Project Validation", () => {
  test("first-time visitor creates a project and completes the guided scenes", async ({ page }) => {
    await page.goto("/home");

    const createButton = page.getByRole("button", { name: /Create a Project/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForURL(/\/project\/[^/]+\/experience\?scene=onboarding/, { timeout: 15_000 });
    await expect(page.getByText(/Guided Onboarding/i)).toBeVisible();
    const onboardingUrl = page.url();
    const idMatch = onboardingUrl.match(/project\/([^/]+)/);
    expect(idMatch).not.toBeNull();

    await page.setInputFiles('input[type="file"]', {
      name: "inventory.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("system,owner\nERP,Ops\nCRM,Sales"),
    });

    const proceedButton = page.getByRole("button", { name: /Proceed to Digital Twin/i });
    await expect(proceedButton).toBeVisible({ timeout: 10_000 });
    await proceedButton.click();

    await page.waitForURL(/scene=digital/, { timeout: 15_000 });
    await expect(page.getByText(/Digital Twin/i).first()).toBeVisible();
    await expect(page.getByText(/Guided Focus/i)).toBeVisible();

    const viewsHeader = page.getByRole("button", { name: /VIEWS/i }).first();
    if ((await viewsHeader.getAttribute("aria-expanded")) !== "true") {
      await viewsHeader.click();
    }
    await page.getByRole("button", { name: /Σ ROI/i }).click();
    await page.getByText(/ROI 1 \(Hypothesis\)/i).click();
    await page.waitForURL(/scene=roi/, { timeout: 10_000 });
    await expect(page.getByText(/ROI Dashboard/i)).toBeVisible();
    await expect(page.getByText(/Total Cost of Change/i)).toBeVisible();

    const viewsHeaderReview = page.getByRole("button", { name: /VIEWS/i }).first();
    if ((await viewsHeaderReview.getAttribute("aria-expanded")) !== "true") {
      await viewsHeaderReview.click();
    }
    await page.getByTestId("view-view-review").click();
    await page.waitForURL(/scene=review/, { timeout: 10_000 });
    await expect(page.getByText(/Review/i).first()).toBeVisible();

    await recordTestResult(page, "new-project-flow.full-path", "D080");
  });
});
