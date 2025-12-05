## 🥒 **D040 — Transformation Sequencer UAT Criteria (Hypothesis + Execution Modes)**

### **1. Environment Prep**
- Branch `feat/d040_transformation_sequencer` pulled and clean build (`npm run dev` passes).  
- `.fuxi/data/projects/{id}/transformations.json` exists with at least two stages.  
- `.fuxi/data/projects/{id}/financials.json` exists for **execution mode** testing.  
- `NEXT_PUBLIC_TELEMETRY_DEBUG=true` for full event capture.  

---

### **2. Hypothesis Mode Validation**
**Goal:** Validate conceptual transformation sequencing (T-Shirt sizing).  

#### Functional
- Upload a harmonized dataset → systems appear grouped by domain.  
- `transformations.json` drives stage-based transitions.  
- Timeline slider animates system changes by stage.  
- Dual-system overlaps render as **dual-color glow** (ERP example).  
- Tooltip shows transition type (`Replace`, `Enhance`, `Retire`).  

#### Telemetry
- Verify events:  
  - `stage_entered` with stageId and visibleNodes count.  
  - `system_transition` for any changing node.  
  - `overlap_detected` for dual-system operation periods.  

#### Output
- **Visual clarity:** Graph reflows smoothly on stage transition.  
- **Performance:** Transition ≤ 2s with 300 nodes.  
- **State retention:** Returning to “Current” restores full graph.  

---

### **3. Execution Mode Validation**
**Goal:** Confirm financial and ROI data binds to transformation stages.  

#### Functional
- Switch `sequencerMode` to `"execution"`.  
- Cost data from `financials.json` overlays stage view (e.g., tooltips or sidebar).  
- Total cost per stage updates dynamically with timeline movement.  
- Overlap cost impact (dual-system ops) reflected in displayed totals.  
- `/api/roi/forecast` returns data combining harmonized + transformation + financial JSON.  

#### Telemetry
- Verify additional events:  
  - `roi_stage_calculated`  
  - `cost_delta_detected`  
  - `budget_curve_updated`  

#### Output
- ROI overlay line appears above graph (summary of cost vs. value).  
- Costs align with expected mock data ±5%.  
- Graph transitions still performant (<2.5s).  

---

### **4. Regression Checks**
- Project flow: Intake → Tech Stack → Ecosystem still valid.  
- No broken telemetry from prior directives (D043A/D036).  
- `/api/digital-enterprise/view` still returns full graph for mode=“all.”  

---

### **5. Exit Criteria**
✅ Hypothesis + Execution both render accurate transitions.  
✅ Telemetry events confirmed in `.fuxi/data/telemetry_events.ndjson`.  
✅ ROI overlay and stage animation verified.  
✅ Tag branch: **v0.7.0-hat-d040** (Human Acceptance Test baseline).  

---

## ⚙️ **Fuxi Mesh Bootstrap Checklist (For Your Second Machine)**

| Step | Purpose | Command / Action |
|------|----------|------------------|
| 1 | Clone repo + checkout active branch | `git clone <repo> && git checkout dev` |
| 2 | Start local Codex listener | `npm run dev` |
| 3 | Verify telemetry file access | `.fuxi/data/telemetry_events.ndjson` visible |
| 4 | Start mesh relay thread | `fuxi_ea_main` via `fuxi_mesh_ngrok_app__jit_plugin.sendToMesh` |
| 5 | Send handshake | `mesh:sync_context` (state + directive summary) |
| 6 | Confirm response | “Context synced for dev + directives 040–043A loaded” |
| 7 | Test relay | Run simple Codex command (`telemetry summary`) from Mesh UI |
| 8 | Secure mesh config | Lock mesh to local relay (`mesh_mode: local-only`) for dev isolation |

---

## 🔄 **Reintegration Plan — Dual-System State Sync**
Once both systems are online:

1. Each node (machine) runs Codex in isolated dev mode.  
2. Mesh thread syncs current directive state, project ID, and telemetry logs.  
3. Shared context persisted in `.fuxi/data/mesh_state.json`.  
4. Fuxi Mesh automatically reconciles divergent state (file-level diff).  
5. When reconciled → push unified state to dev branch for continuity.  

---

**Next Action:** Hand this package to Codex. He can execute D040 UAT while wiring mesh bootstrap and local relay.  
Once verified, tag branch `v0.7.0-hat-d040` and merge to `dev`.  

