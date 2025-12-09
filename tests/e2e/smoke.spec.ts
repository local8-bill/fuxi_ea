import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
  await expect(page.getByPlaceholder("Ask where to go next…")).toBeVisible();
});

test("verification page responds", async ({ page }) => {
  await page.goto("/project/demo/verification");
  await expect(page.getByText(/Verification/i)).toBeVisible();
});
