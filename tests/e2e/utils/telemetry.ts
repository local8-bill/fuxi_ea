import type { Page } from "@playwright/test";

export async function recordTestResult(page: Page, testName: string, directive = "D061") {
  try {
    await page.request.post("/api/telemetry", {
      data: {
        event_type: "test_run_completed",
        workspace_id: "uat",
        data: {
          directive,
          test: testName,
          result: "passed",
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    // best-effort telemetry; ignore failures during UAT
  }
}
