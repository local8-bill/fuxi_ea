import { test, expect } from "@playwright/test";

const writeSession = async (request: import("@playwright/test").APIRequestContext, payload: Record<string, any>) => {
  await request.post("/api/home/context", {
    data: {
      projectId: "demo-x",
      ...payload,
    },
  });
};

test.describe("D071 Command Deck Home", () => {
  test.describe.configure({ mode: "serial" });

  test("first-time visitors see welcome guidance", async ({ page, request }) => {
    await writeSession(request, { firstTime: true, lastSeen: null, lastStage: null, lastIntent: null });

    await page.goto("/home");
    await expect(page.getByText("Welcome", { exact: false })).toBeVisible();
    await expect(page.getByText("Start guided onboarding", { exact: false })).toBeVisible();
  });

  test("returning visitors can resume last stage", async ({ page, request }) => {
    await writeSession(request, {
      firstTime: false,
      lastStage: "harmonization",
      lastIntent: "sequence",
      lastSeen: new Date().toISOString(),
    });

    await page.goto("/home");
    await expect(page.getByText("Welcome back", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: /Resume where I left off/i }).click();
    await expect(page).toHaveURL(/\/project\/demo-x\/dashboard/);
  });
});
