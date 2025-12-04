## Directive D061 – Playwright UAT Layer

### 🎯 Objective
Establish automated end-to-end UI testing for *Fuxi_EA* using **Playwright**. The goal is to ensure each major UX flow (Navigation, ROI Dashboard, Graph, Sequencer) performs reliably and logs correct telemetry. This becomes the basis for continuous Human Acceptance Testing (HAT) validation.

---

### 🧩 Scope
- Implement Playwright as the default UI automation framework.
- Cover navigation, ROI dashboard, and graph views.
- Link test results to directive coverage via telemetry.
- Integrate into CI/CD pipeline.

---

### ⚙️ Implementation Steps

#### 1. Install & Scaffold
```bash
npx playwright install
```
Generates `/tests` directory and browsers.

#### 2. Configuration File
Create `playwright.config.ts` at project root:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
});
```

---

#### 3. Test Structure
```
/tests
 ├── nav.spec.ts         # Navigation expand/collapse & telemetry
 ├── roi.spec.ts         # ROI dashboard load, net ROI check, break-even validation
 ├── graph.spec.ts       # Graph render test, minimap, edges
 └── utils/telemetry.ts  # Helper for checking telemetry logs
```

---

#### 4. Sample Test: Navigation Flow
```ts
import { test, expect } from '@playwright/test';

test('ROI section expands and logs telemetry', async ({ page }) => {
  await page.goto('/');
  await page.click('text=ROI');
  await expect(page.locator('text=ROI 1 (Hypothesis)')).toBeVisible();

  const telemetry = await page.evaluate(() =>
    window.localStorage.getItem('fuxi_nav_state')
  );
  expect(telemetry).toContain('ROI');
});
```

---

#### 5. CI/CD Integration
Add to `.github/workflows/ci.yml`:
```yaml
- name: Run Playwright tests
  run: npx playwright test
```
Artifacts (video, trace, logs) stored for every failed test.

---

### 🧠 Telemetry & Directive Mapping
Each test will emit a `test_run_completed` event including:
```json
{
  "directive": "D061",
  "test": "nav.spec.ts",
  "result": "passed",
  "timestamp": "ISO-8601"
}
```

Telemetry will be appended to `.fuxi/data/telemetry_events.ndjson` for traceability.

---

### 🧱 Phase 1 Coverage
| Feature | Test | Directive | Status |
|----------|------|------------|---------|
| Navigation (Chevron UX) | nav.spec.ts | D060B | 🔄 In progress |
| ROI Dashboard | roi.spec.ts | D051/D052 | 🔄 In progress |
| Graph (React Flow) | graph.spec.ts | D047/D041 | ⏳ Pending |
| Sequencer Timeline | sequencer.spec.ts | D040 | ⏳ Planned |

---

### ✅ Success Criteria
- All priority flows tested via Playwright.
- Telemetry successfully logs test results.
- CI pipeline runs full suite automatically.
- Visual stability verified (<2s load, no layout shifts).

---

### 📦 Deliverables
- `/tests` directory committed with baseline specs.
- `playwright.config.ts` included.
- CI run + report visible in GitHub Actions.
- Telemetry trace for each directive test.

---

**Target tag:** `v0.7.0-playwright-baseline`

