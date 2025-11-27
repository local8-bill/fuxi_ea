## Directive D021: UX Baseline Study Protocol

**Status:** 🚧 In Progress

### Purpose
To establish a quantitative and qualitative baseline for user experience across all Fuxi_EA workspaces prior to adaptive refinement. This protocol defines how telemetry (from D020-TH) and manual user feedback are combined to create a first benchmark for cognitive load, usability, and user flow efficiency.

---

### 1. Objectives
- Quantify usability through measurable telemetry data.
- Identify friction points, confusion moments, and flow disruptions.
- Correlate Simplification Scores (from D019) with real user interaction patterns.
- Produce a repeatable framework for future UX regression and improvement testing.

---

### 2. Study Participants
**Primary Tester:** Internal Architect (Bill / Lead EA)
**Additional Testers:** Optional — internal team members or early collaborators.
**User Context:** Simulate actual EA usage — building a real project from scratch.

---

### 3. Scenarios & Tasks
Each scenario corresponds to one core workspace:

| Workspace | Task Description | Expected Outcome |
|------------|-----------------|------------------|
| **Intake** | Create new project, define objectives, and complete intake summary. | Validated intake summary saved. |
| **Tech Stack** | Upload CSV/XLS, normalize stack, confirm system list. | Clean normalized dataset validated. |
| **Digital Enterprise** | Import Lucid or CSV, explore graph, confirm dependencies. | Complete dependency map displayed. |
| **Portfolio** | Run scenario simulation and compare deltas. | ROI and trade-off summary produced. |
| **Insights** | Review generated insights and export report. | Insight document successfully generated. |

---

### 4. Data Capture Framework
Telemetry hooks (from D020-TH) will log all primary interactions:

**Telemetry Data Fields:**
- `session_id`
- `workspace_id`
- `event_type`
- `timestamp`
- `data` (task context)
- `simplification_score`

**Qualitative Overlay:**  
Testers record:
- Expectation vs. outcome  
- Confusion/friction notes  
- Flow moments (“felt smooth/easy”)  
- Navigation comments (too many clicks, unclear next step)

---

### 5. Metrics & Targets
| Metric | Definition | Target | Notes |
|---------|-------------|---------|-------|
| Task completion time | Time from start to success signal | < 60s per task | Normalized per workspace |
| Error frequency | Count of validation or action errors | < 2 per task | Derived from telemetry |
| Simplification score | Cognitive ease per task | > 0.75 | From D019 algorithm |
| Idle time | Longest pause between actions | < 10s | From telemetry timestamps |
| Navigation depth | Clicks-to-goal | < 5 | Tracked via stage transitions |
| Abandon rate | Unfinished sessions | < 15% | Drop detection via telemetry |

---

### 6. Analysis Plan
**Quantitative:**  
Codex aggregates telemetry logs and computes:
- Mean/median for all numeric metrics.
- Simplification distribution per workspace.
- Delta between baseline runs and later optimization phases.

**Qualitative:**  
Manual coding of feedback into themes:
- Confusion triggers  
- Visual overload  
- Success moments  
- Intuitive actions

**Correlation Analysis:**  
Cross-reference Simplification Scores with reported ease/difficulty.

---

### 7. Reporting Structure
Final baseline report includes:
- Summary dashboard (avg metrics per workspace)
- Top 3 friction points
- Top 3 satisfaction moments
- Recommendations for simplification
- Suggested test adjustments for next round

Output: `docs/reports/ux_baseline_report_v1.md`

---

### 8. Pre-Test Checklist
Before initiating the first UX baseline run, ensure the following environment setup and instrumentation validation steps are complete:

**Environment Setup:**
1. Checkout branch `feat/d020_adaptive_ux_journey_map`.
2. Ensure all telemetry hooks are active (D020-TH complete).
3. Set `NEXT_PUBLIC_TELEMETRY_DEBUG=true` in `.env.local`.
4. Run `npm run dev` and verify app loads at `http://localhost:3000`.

**Instrumentation Validation:**
1. Open browser console; verify `useTelemetry` logs are visible in debug mode.
2. Complete a mock task in each workspace; confirm events appear in SQLite `telemetry_events` table.
3. Confirm Simplification Score values are appended where available.
4. Validate `/api/telemetry` endpoint returns HTTP 200 for test events.

**Approval to Begin Test:**
Once instrumentation validation passes, tag session as `baseline_run_v1` and begin executing full task suite.

---

### 9. Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Telemetry Captured | Events logged across all workspaces | ☐ | Codex | |
| Simplification Data Integrated | D019 scores linked | ☐ | Mesh | |
| Manual Notes Logged | Human commentary complete | ☐ | Fuxi | |
| Metrics Aggregated | Quantitative baseline calculated | ☐ | Codex | |
| Baseline Report Generated | `ux_baseline_report_v1.md` created | ☐ | Fuxi | |

---

### Directive Metadata
- **Project:** Fuxi_EA  
- **Directive ID:** D021  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** UX Validation Protocol  
- **Priority:** Critical  
- **Feature Branch:** `feat/d021_ux_baseline_study`  
- **Status:** 🟡 Pending Implementation  
- **Next Step:** Codex to integrate telemetry aggregation; user (Bill) to perform baseline UX walkthrough.
