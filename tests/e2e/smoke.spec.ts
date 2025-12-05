import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Fuxi/i })).toBeVisible();
});

test("verification page responds", async ({ page }) => {
  await page.goto("/project/demo/verification");
  await expect(page.getByText(/Verification/i)).toBeVisible();
});
