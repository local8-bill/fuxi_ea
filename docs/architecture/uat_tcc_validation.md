# UAT Checklist – Total Cost of Change (TCC) Validation (D052B + D061)

## Purpose
This User Acceptance Test (UAT) validates that the Total Cost of Change (TCC) model and visualization operate as designed per **D052B** (business logic) and **D061** (Playwright UAT Layer). It ensures the Fuxi ROI module correctly computes, displays, and tracks TCC metrics with full transparency and telemetry.

---

## Test Environment
- **Branch:** `feat/d052b_tcc_model`
- **Tag:** `v0.7.1-TCC-baseline`
- **Browser:** Chromium (Playwright default)
- **Config:** `NEXT_PUBLIC_GRAPH_ENGINE=reactflow`
- **Data:** Sample project `700am` with harmonized financials.json + transformations.json

---

## Test Cases

### 1. API Validation
**Objective:** Confirm `/api/roi/forecast` returns expected TCC fields.

| ID | Test | Steps | Expected Result |
|----|------|-------|----------------|
| TCC-API-01 | Verify TCC JSON schema | Run `curl /api/roi/forecast?project=700am` | JSON includes `tcc_total`, `tcc_ratio`, `classification` |
| TCC-API-02 | Validate TCC math | Compare output vs `math_explainers.md` formula | TCC values match computed result ±2% |
| TCC-API-03 | Confirm telemetry emission | Inspect `/telemetry/logs` | `tcc_computed` event emitted with payload {domain, tcc_total, ratio} |

---

### 2. UI Visualization
**Objective:** Validate ROI dashboard correctly renders TCC components.

| ID | Test | Steps | Expected Result |
|----|------|-------|----------------|
| TCC-UI-01 | Verify TCCSummaryCard renders | Navigate to ROI dashboard | Card visible with title **Total Cost of Change** |
| TCC-UI-02 | Check component breakdown | Hover tooltip over bar chart | Tooltip shows 5 cost components (project, transition, operational, human, risk) |
| TCC-UI-03 | Verify ratio color scheme | Observe color tone | Lean=Green, Moderate=Amber, Complex=Red |
| TCC-UI-04 | Expand detailed view | Click on card link | Opens domain-level breakdown modal |
| TCC-UI-05 | Confirm telemetry log | Check dev console/network | `tcc_visualized` event logged |

---

### 3. Playwright Automation (D061 Integration)
**Objective:** Run regression and telemetry validation automatically.

| ID | Test | Playwright Action | Expected Result |
|----|------|------------------|----------------|
| TCC-AUTO-01 | `test/api_tcc_schema.spec.ts` | Verifies API fields exist | All assertions pass |
| TCC-AUTO-02 | `test/ui_tcc_visual.spec.ts` | Confirms visual components load | ROI summary and bar chart visible |
| TCC-AUTO-03 | `test/telemetry_tcc.spec.ts` | Mocks telemetry hook and checks events | Events logged correctly |

---

### 4. UX and Performance
**Objective:** Ensure UI experience meets acceptance.

| ID | Test | Steps | Expected Result |
|----|------|-------|----------------|
| TCC-UX-01 | Load time test | Load ROI dashboard | <2s render time for 100-node graph |
| TCC-UX-02 | Responsive layout | Resize to 1024px width | No overflow or clipping |
| TCC-UX-03 | Accessibility contrast | Run axe-core audit | AA-compliant color contrast |

---

## Acceptance Criteria
1. All **API**, **UI**, and **Telemetry** test cases pass.
2. TCC visualization aligns with values computed in `math_explainers.md`.
3. Playwright tests yield `PASS` for 100% of assertions.
4. Telemetry events appear within <500ms after UI interaction.
5. No console warnings or performance regressions.

---

## Reporting
- Test results stored in `/reports/uat/tcc/uat_tcc_validation_<date>.json`
- Summary auto-posted to `/docs/releases/changelog.md`
- UAT completion triggers tag: `v0.7.1-TCC-UAT-approved`

---

## Next Steps
- [ ] Merge validated branch to `dev`
- [ ] Enable TCCSummaryCard in ROI dashboard for all projects
- [ ] Extend telemetry coverage to sequencer views
- [ ] Prepare executive ROI + TCC combined summary (D053 follow-up)

