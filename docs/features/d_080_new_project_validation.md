## 🧩 Directive D080 — End-to-End New Project Validation Flow

### Objective
Guarantee that the Fuxi _EA system performs a seamless **new project creation-to-review** experience, ensuring all major subsystems — UXShell, EAgent, ALE-Lite, Telemetry, and Sequencer — operate without drift before any demo, deploy, or version tag.

---

### Workflow Overview
**Path tested:**  
`/home` → `+ New Project` → `/project/[id]/experience?scene=onboarding` → `/experience?scene=digital` → `/experience?scene=roi` → `/experience?scene=review`

---

### 1️⃣ Environment Preparation

Run these before test execution:
```bash
git pull origin main
git checkout -b feature/test_new_project_flow
npm ci
npm run dev:nuke
```

> *Clears `.next`, `.turbo`, telemetry logs, and Playwright caches to ensure clean baselines.*

---

### 2️⃣ Validation Steps

| Step | Expected Behavior | Outcome Criteria |
|------|-------------------|------------------|
| **1. Home Load** | `/home` renders with brand header and “+ New Project.” | Hero, tiles, and global nav render correctly. |
| **2. Create Project** | Click “+ New Project” → initializes `/api/projects/init`. | Redirect to `/project/<id>/experience?scene=onboarding`. |
| **3. Upload Artifact** | Upload sample inventory CSV or JSON. | Auto-transition to `/experience?scene=digital`. |
| **4. Graph Generation** | Digital Twin renders full dependency map. | `digital_twin_loaded` telemetry emitted. |
| **5. ROI / TCC Summary** | Transition to ROI scene; summary and cost cards appear. | `roi_stage_calculated`, `tcc_computed` logged. |
| **6. Sequencer** | Sequencer toggle visible and functional. | Sequence chart renders with telemetry sync. |
| **7. Review Scene** | Review summary and harmonization list shown. | All components present, no console errors. |

---

### 3️⃣ Telemetry Validation

Inspect `.fuxi/data/telemetry_events.ndjson` for:

- ✅ `project_created`
- ✅ `artifact_uploaded`
- ✅ `digital_twin_loaded`
- ✅ `roi_stage_calculated`
- ✅ `tcc_computed`
- ✅ `mode_switch: user`
- ✅ `uxshell_view_selected`

> **Fail condition:** duplicate `uxshell_interaction` events or stale telemetry (timestamps older than session start).

---

### 4️⃣ Mode Integrity

| Mode | Action | Expected |
|------|---------|-----------|
| `/mode user` | Default after project creation | Standard UX visible, EAgent conversational. |
| `/mode founder` | Manual switch | Directive panel + telemetry console visible. |
| `/mode demo` | Optional run | Polished UI, readonly. |

---

### 5️⃣ Test Execution (Playwright)

```bash
npx playwright test --grep "smoke|nav"
```

Expected output:
- ✅ All smoke and navigation specs pass.
- ⚙️ ROI / Sequencer / Review load within 5 s.
- 🪶 No regressions on UXShell layout or sidebar.

---

### Deliverables
- Updated Playwright suite: `/tests/e2e/new_project_flow.spec.ts`
- Telemetry confirmation script: `/scripts/verify_telemetry_events.js`
- CI automation hook for pre-demo validation

---

### Governance
- **Branch:** `feature/d080_new_project_validation`
- **Commit:** `test(flow): validate full project creation-to-review path`
- **Approvers:** Fuxi & Agent Z (Bill)
- **Dependencies:** D077C-L (ALE-Lite), D079 (Contextual Modes)
- **Output:** Verified and telemetry-complete end-to-end project creation flow, ready for demo or production deploy.

