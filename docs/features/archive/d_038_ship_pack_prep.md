## Directive D038 — Ship Pack Prep
**Branch:** `release/ship-pack-v1`  
**Tag After Completion:** `v1.0.0-ship-pack`

---

### 🧭 Overview — What “Ship Pack” Means

In the Fuxi_EA workflow, a **Ship Pack** is not a feature branch — it’s a *validated release milestone* designed to demonstrate integrated system capability.  
It signals the transition from iterative directive work to *cohesive, user-facing value*.  

Each Ship Pack must meet three conditions:
1. All core user journeys are functional end-to-end.
2. No known blockers or regressions remain.
3. Documentation, telemetry, and directive traceability are complete.

This is the standard used for both internal validation and external demo readiness.

---

### 🎯 Purpose

Prepare and validate the Fuxi_EA platform for its first public *Ship Pack* release. This directive ensures all implemented functionality is production-stable, documented, and ready for live demonstration. No new feature development—only validation, polish, and packaging.

---

### ✅ In-Scope

#### 1. **Functional Verification (End-to-End)**
- Confirm full user journey from **Project Creation → Intake → Tech Stack Upload → Harmonization → Digital Enterprise View**.  
- Validate upload types: CSV, XLSX, PNG/PDF placeholders (mock OCR ingest path working).  
- Ensure project gating (Intake-first navigation) and middleware flow function correctly.  
- Verify DE graph loads without runtime or rendering errors (≥1k nodes, ≥2k edges tolerance).

#### 2. **UI/UX Consistency Check**
- Intake, Tech Stack, DE Graph, and Harmonization Review pages must share consistent:
  - Header/nav structure  
  - Project status breadcrumb  
  - Action button placement and behavior  
- Ensure all CTAs (Continue, Harmonize, Validate Connections) route correctly.

#### 3. **Telemetry & Logging Validation**
- Tail `/api/telemetry` events across key user actions (upload, harmonization, review, DE load).  
- Confirm no duplicate workspace_view or graph_load events.  
- Verify success signals: `harmonization_complete`, `connection_confirmation`, `transformation_dialogue`, etc.  
- Snapshot telemetry summary for release documentation.

#### 4. **Verification Dashboard (QA View)**
- Populate the dashboard with live directive statuses (✅/🚧/🟥).  
- Confirm all directives through D037a marked complete or cleanly deferred.  
- Integrate directive summaries + verification checks inline.

#### 5. **Packaging & Branch Hygiene**
- Merge the following branches after QA validation:
  ```bash
  git merge refactor/code_review_pass_v1
  git merge feat/d037_graph_visual_optimization
  ```
- Run final lint/tests: `npm run lint && npm test`.
- Remove obsolete `d_024_rate_limit_refactor`, `d_026_harmonization_test`, and other archived docs from root.

---

### ⚙️ Out-of-Scope (Next Phase — D039+)
- Full OCR/AI ingestion of diagrams.  
- Mesh telemetry integration.  
- Role-based access control.  
- Real DB migration (SQLite/Postgres).  
- External API integrations (Lucid, ServiceNow, etc.).

---

### 🧩 Test & Verification
| Checkpoint | Expected Result | Owner |
|-------------|----------------|--------|
| End-to-End Flow | New user completes full flow without manual trigger | Codex |
| Telemetry | Logs single, accurate events per action | Fuxi |
| DE Graph | Loads harmonized data cleanly | Codex |
| Verification Dashboard | Displays all directive statuses | Fuxi |
| Release Build | Compiles & deploys without Edge/Node runtime errors | Mesh QA |

---

### 📦 Release Process
1. Tag release:
   ```bash
   git tag -a v1.0.0-ship-pack -m "Fuxi_EA Ship Pack v1 (Harmonization, DE Graph, Full Flow)"
   git push origin v1.0.0-ship-pack
   ```
2. Create release notes summarizing:
   - Implemented directives (D019–D038)  
   - Known limitations  
   - Roadmap (OCR ingestion, AI synthesis, Mesh integration)
3. Deploy to staging/demo environment for stakeholder walkthrough.

---

### 🧭 Outcome
A validated, demo-ready version of Fuxi_EA capable of:
- Full project onboarding flow.
- Artifact upload and harmonization.
- Digital Enterprise graph visualization with confidence states.
- Persistent telemetry and verification dashboard.

This represents the **first stable milestone** in the platform’s lifecycle — the foundation for the next evolution toward *adaptive architecture intelligence*. 🚀

---

### 🧹 QA Findings — Lint & Runtime Checks

- **npm run lint** no longer valid in Next 16; replaced with `npx eslint .`.
- **ESLint Findings:** 188 errors, 56 warnings.
  - Primary issues: use of `any`, unused vars, setState in effects, refs during render.
  - Most issues originate from legacy code; defer to D039 (Targeted Lint Cleanup).
- **Runtime Check (Planned):** Local smoke test via `npm run dev` to confirm startup, navigation, DE render, and telemetry write.

---

### 🧩 Next Directive Stub — D039 Targeted Lint Cleanup
**Purpose:** Reduce ESLint violations by 85% in actively maintained code paths.
- Focus scope: `/api`, `/components/LivingMap.tsx`, `/domain/services/*`, `/app/project/*`.
- Introduce stricter TS types incrementally.
- Adjust CI lint command for Next 16+ (`eslint . --max-warnings=0`).
- Deliver as post-ship patch branch: `feat/d039_lint_cleanup`.

**Trigger:** Automatically activated once `v1.0.0-ship-pack` tag is confirmed and QA passes.

---

### 🧠 Codex Execution Plan — D038 QA Handoff

**Objective:** Validate integrated functionality and confirm readiness for tagging `v1.0.0-ship-pack`.

**Execution Steps:**
1. **Startup Validation**  
   - Run `npm run dev`.  
   - Confirm app launches without build/runtime errors.  
   - Validate navigation flow: **Home → Project Creation → Intake → Tech Stack → DE Graph**.  
   - Ensure auto-harmonization triggers upon CSV upload.

2. **Telemetry Verification**  
   - Tail `.fuxi/data/telemetry_events.ndjson` during actions.  
   - Confirm single `workspace_view`, `harmonization_start`, and `harmonization_complete` per session.  
   - Ensure no duplicate or malformed payloads.

3. **UI / Graph QA**  
   - Verify DE Graph renders cleanly with correct edge colors and legend visibility.  
   - Check cross-domain and hide-isolates toggles.  
   - Ensure node tooltips display upstream/downstream counts.  
   - Validate domain overlays align during pan/zoom.

4. **Verification Dashboard Update**  
   - Record QA results per directive.  
   - Mark D037 and D038 as ✅ Complete once verified.

5. **Branch + Tag Operations**  
   ```bash
   git checkout release/ship-pack-v1
   git merge main
   git tag -a v1.0.0-ship-pack -m "Fuxi_EA Ship Pack v1 (Harmonization, DE Graph, Full Flow)"
   git push origin release/ship-pack-v1 --tags
   ```

6. **Lint Findings**  
   - Skip lint fixes (188 errors, 56 warnings already logged).  
   - Include lint summary in Verification Dashboard.

**Expected Outcome:**  
- All routes functional, telemetry consistent, DE Graph visually verified.  
- Branch tagged and pushed for Ship Pack v1 delivery.  
- QA handoff completed; ready for D039 (lint cleanup) initiation.
