## ⚙️ Directive D085A – Dynamic Transformation Sequencing (Interactive Layer)

### 🎯 Objective

Extend Directive D084C (Enterprise OMS Transformation Graph) into a **fully interactive simulation layer** — enabling transformation sequencing, cost visualization, and learning capture. This marks the first step toward an adaptive transformation planning environment.

---

### 🧭 Context

The foundation graph (D084C) is now running successfully under `/dev/graph-prototype`, visualizing the structural and temporal relationships between OMS, MFCS, EBS, and eCommerce systems. The next step is to make this model *dynamic* — allowing users to test scenarios, view impact, and feed learning data into ALE.

---

### 🧩 Goals

1. **Activate Transformation Sequencing:**
   - Allow users to trigger and reorder transitions between systems (e.g., OMS-first vs MFCS-first).
   - Connect node transitions to phasing bands (FY26–FY28).
   - Animate flow and dependency changes across the graph.

2. **Introduce ROI & TCC Overlays:**
   - Pull ROI/TCC data from model store.
   - Display cost, impact, and risk per phase.
   - Add hover states for financial indicators (Low, Medium, High).

3. **Enable ALE Learning Capture:**
   - Record user choices (order of transformation, prioritization, regional focus).
   - Map these to *Learning Events* (LE-001 through LE-010).
   - Generate adaptive recommendations based on observed decisions.

4. **Add Sequencer Integration:**
   - Fetch phase data directly from `/data/sequencer.json`.
   - Synchronize with graph nodes (by domain, system, and region).
   - Render sequence markers and preview timelines.

---

### 🧱 Technical Composition

**1. Front-End Behavior**
- ReactFlow extensions: node drag, connect, and reorder animations.
- Add `useSequencer()` hook to sync with timeline bands.
- Display dynamic tooltips with ROI, cost, and dependencies.

**2. Data Integration**
- `/data/graph/oms_transformation.json` → core structure.
- `/data/roi_tcc.json` → financial and impact metrics.
- `/data/sequencer.json` → phasing and order of execution.
- `/data/ale/logs.json` → adaptive learning event capture.

**3. ALE Event Model (v1)**
```
LE-001: User triggers OMS-first transition
LE-002: User reorders phase sequencing
LE-003: User toggles regional rollout (e.g., NA before EMEA)
LE-004: ALE detects high coupling risk pattern
LE-005: ROI/TCC delta observed > ±20%
```
Captured events are persisted for the Adaptive Learning Engine and used to improve future recommendations.

---

### 🖥️ UI Features
- **Guided Focus Panel:**  Adds Sequencer controls (play, reorder, simulate).
- **ROI Mode Toggle:**  Switch between Systems / ROI / Risk visualization.
- **Learning Overlay:**  Displays ALE feedback inline (e.g., “Inventory duplication risk ↑ 12%”).
- **Event Console:**  Real-time log of user actions and system responses.

---

### 🔗 Integration Map
| Layer | Source | Target | Function |
| ------ | ------- | ------- | -------- |
| Structural | D084C Graph | D085A Sequencer | System topology input |
| Temporal | `/data/sequencer.json` | Graph timeline | Phasing control |
| Financial | `/data/roi_tcc.json` | Graph overlay | ROI/TCC data feed |
| Cognitive | `/data/ale/logs.json` | ALE Engine | Learning event capture |

---

### ⚙️ Deliverables (Iteration 1)
1. Add Sequencer controls to UI.
2. Enable drag-based reordering of transformation events.
3. Overlay ROI/TCC metrics per phase.
4. Begin ALE event logging and adaptive feedback.

---

### 🧭 Next Iterations
- **Iteration 2:** Add predictive simulation mode (ALE-generated future states).
- **Iteration 3:** Introduce multi-region sequencing and cross-dependency optimization.
- **Iteration 4:** Link to user personas (/mode founder, /mode user) for experience tailoring.

---

### 🧩 Codex Handoff Checklist

**Branching & Environment Setup**
1. Merge `feature/d084c_oms_transformation_graph` into `dev` branch.
2. Create new branch `feature/d085a_dynamic_sequencing` from updated `dev`.
3. Confirm `/dev/graph-prototype` runs with no visual or data sync errors.
4. Commit pre-migration snapshot under `/snapshots/graph_prototype_v084c.json`.

**Implementation Steps**
1. Clone prototype to `/dev/graph-oms` as working module.
2. Integrate Sequencer data source (`/data/sequencer.json`).
3. Add dynamic phasing (FY26–FY28) animation band.
4. Implement ROI/TCC overlay logic with hover state summaries.
5. Connect ALE logging hooks to user actions (drag, reorder, toggle).
6. Validate event logs populate `/data/ale/logs.json`.
7. Sync updated dependencies via package.json (ReactFlow + d3 transitions).
8. Deploy to local build → run test suite (`npm run test:graph-oms`).
9. Review UI interactions for Sequencer reordering, animation, and ALE feedback.

**Testing & Review**
- [ ] Validate ROI metrics load per system node.
- [ ] Confirm Sequencer phase transitions align with FY bands.
- [ ] Check ALE logs for accurate event capture.
- [ ] Verify hover tooltips display ROI, TCC, and Risk values.
- [ ] Ensure EAgent commentary syncs to event changes.

**Promotion Plan**
1. After validation → merge into `feature/graph-oms-production`.
2. Update routing: `/dev/graph-prototype` → `/graph-oms` (production path).
3. Archive prototype assets.

---

### 🔍 Post-Implementation Review

Once D085A is deployed and validated, conduct a 3-phase review to ensure stability, usability, and learning integrity.

**Phase 1 – Functional Validation**
- Confirm full graph interactivity across domains (OMS/MFCS/EBS).
- Validate ROI/TCC overlays accurately reflect financial data.
- Ensure Sequencer logic aligns with Jesse’s phasing plan (FY26–FY28).

**Phase 2 – Learning & Analytics Check**
- Review ALE logs for diversity and accuracy of captured Learning Events.
- Verify adaptive feedback displays correct insights (risk/cost/reward).
- Benchmark response latency between user input → ALE recommendation (<300ms target).

**Phase 3 – User Experience Feedback**
- Run internal usability session (/mode founder and /mode user).
- Capture qualitative feedback on animation clarity, phase navigation, and data readability.
- Log improvements and patch items for Directive D085B.

---

**Branch:** `feature/d085a_dynamic_sequencing`

**Approvers:** Fuxi Core, Agent Z (Bill), Codex

**Purpose:** Transform a static visualization into an interactive, learning-driven simulation of enterprise modernization sequencing — bridging architecture, ROI, and adaptive intelligence.

