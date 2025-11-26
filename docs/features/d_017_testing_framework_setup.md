## Directive 017: Automated Testing Framework Setup

### Purpose
To establish a consistent and maintainable automated testing framework that integrates with the Verification Dashboard (D014) and supports both backend and frontend components across Fuxi_EA. This directive ensures that all core features are validated continuously, enabling stability, reliability, and faster iteration.

---

### Objectives
1. Implement a dual testing setup using **Vitest** for unit/integration tests and **Playwright** for end-to-end (E2E) tests.
2. Integrate test results with the **Verification Dashboard (D014)** for real-time reporting.
3. Enable both **manual** and **automated test triggers** (via Mesh or local execution).
4. Create reusable test templates for feature directives (e.g., D011–D015).
5. Establish a baseline for performance and regression testing before v0.6.

---

### Implementation Plan

#### 1. Framework Setup
- **Install Dependencies**  
  ```bash
  npm install --save-dev vitest @vitest/ui @testing-library/react playwright @playwright/test
  ```

- **Configuration Files**
  - `vitest.config.ts`: project root config for unit/integration tests.
  - `playwright.config.ts`: browser configuration, test directory, headless toggle.

#### 2. Directory Structure
```
/tests
 ├── unit/              # Vitest unit tests
 ├── integration/       # Cross-component logic tests
 ├── e2e/               # Playwright browser tests
 └── mocks/             # Data mocks and fixtures
```

#### 3. Dashboard Integration (D014)
- Expose JSON endpoint `/api/tests/status` that returns test metadata and results.
- Verification Dashboard polls this endpoint to visualize pass/fail counts.
- Store historical test runs under `.fuxi/tests/results.json` for reference.

#### 4. Test Scenarios
| Category | Focus | Example |
|-----------|--------|----------|
| Unit | Component logic | CapabilityCard renders correct score |
| Integration | Workflow validation | Import → Score → Visualize flow works end-to-end |
| E2E | UI behavior | User uploads CSV and sees updated visualization |
| Regression | Legacy validation | Previous scoring modules behave identically |

#### 5. Execution
- Local: `npm run test:unit`, `npm run test:e2e`
- CI: Auto-triggered on `push` and `merge` events for main/feature branches.
- Mesh Integration: Agents can request `/api/tests/run` for automated verification.

---

### Outputs
- Unified test reports in `/tests/reports`.
- JSON summaries integrated with Verification Dashboard.
- Test metrics available for Mesh Console and scenario validation.

---

### Verification Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Vitest Config | Unit/integration tests run successfully | ☐ | Codex |  |
| Playwright Config | Browser tests execute cleanly | ☐ | Codex |  |
| Dashboard Link | Results visible in D014 dashboard | ☐ | Fuxi |  |
| Historical Storage | Test results persist correctly | ☐ | Mesh |  |
| CI Integration | Auto-trigger working on push/merge | ☐ | Codex |  |
| Mesh Trigger | `/api/tests/run` endpoint operational | ☐ | Fuxi |  |

---

### Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** Testing Directive  
- **Priority:** Critical  
- **Feature Branch:** `feat/d017_testing_framework_setup`  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D017_testing_framework_setup.md`

