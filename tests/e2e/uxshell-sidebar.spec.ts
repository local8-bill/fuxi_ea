import { test, expect } from "@playwright/test";
import { recordTestResult } from "./utils/telemetry";

test.describe("D066C UXShell Sidebar Behavior", () => {
  test("expands and collapses sections correctly", async ({ page }) => {
    await page.goto("/project/700am/dashboard");

    const projectsToggle = page.getByRole("button", { name: /^PROJECTS$/i }).first();
    await projectsToggle.click();
    await expect(projectsToggle).toHaveAttribute("aria-expanded", "false");
    await projectsToggle.click();
    await expect(projectsToggle).toHaveAttribute("aria-expanded", "true");

    const viewsToggle = page.getByRole("button", { name: /^VIEWS$/i }).first();
    await viewsToggle.click();
    await expect(page.getByRole("button", { name: /Σ ROI/ })).toBeVisible();

    await recordTestResult(page, "uxshell-sidebar.expand-collapse", "D066C");
  });

  test("loads ROI view when clicking nav items", async ({ page }) => {
    await page.goto("/project/700am/dashboard");

    await page.getByRole("button", { name: /^VIEWS$/i }).first().click();
    await page.getByRole("button", { name: /Σ ROI/ }).click();
    await page.getByText("ROI 1 (Hypothesis)").click();

    await expect(page).toHaveURL(/\/project\/700am\/roi\/hypothesis/);
    await expect(page.getByRole("heading", { name: /ROI Forecast \(Hypothesis Mode\)/i })).toBeVisible();

    await recordTestResult(page, "uxshell-sidebar.roi-navigation", "D066C");
  });

  test("mode changes emit telemetry", async ({ page }) => {
    await page.goto("/project/700am/dashboard");
    await page.getByRole("button", { name: /^MODES$/i }).click();

    const telemetryPromise = page.waitForResponse(async (response) => {
      if (!response.url().includes("/api/telemetry")) return false;
      try {
        const payload = await response.request().postDataJSON();
        return payload?.event_type === "uxshell_mode_changed";
      } catch {
        return false;
      }
    });

    await page.getByText("Analyst", { exact: true }).click();
    const telemetryResponse = await telemetryPromise;
    const body = await telemetryResponse.request().postDataJSON();
    expect(body.event_type).toBe("uxshell_mode_changed");

    await recordTestResult(page, "uxshell-sidebar.mode-telemetry", "D066C");
  });

  test("sidebar width stays within lock bounds", async ({ page }) => {
    await page.goto("/project/700am/dashboard");
    const width = await page.$eval(".uxshell-sidebar", (el) => (el as HTMLElement).offsetWidth);
    expect(width).toBeLessThanOrEqual(320);

    await recordTestResult(page, "uxshell-sidebar.width-lock", "D066C");
  });
});
