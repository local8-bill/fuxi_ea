## Directive D086D – Scene Transition Test Plan (Developer Handoff)

### 🎯 Objective
Validate and finalize the **Digital Twin → Sequence** transition flow for promotion to production readiness. Ensure stable scene switching, state continuity, and UI alignment under the new Shadcn template architecture.

---

### 🧩 Test Scope
Applies to transitions between the following scenes:
- **Digital Twin** → **Sequence**
- **Sequence** → **ROI/TCC View**
- **ROI/TCC View** → **Intelligence Reports**
- **Intelligence Reports** → **Digital Twin (loop back)**

---

### 🧠 Preconditions
- Shadcn UI integrated with scene template system.
- `SceneManager` orchestrating active scene state.
- Graph data pulled from `digitalEnterpriseStore`.
- `feature/ux-template_refactor` branch active and synced.

---

### 🧪 Test Steps (Developer Checklist)
#### 1. Digital Twin → Sequence Transition
- [ ] Launch Digital Twin scene.
- [ ] Verify both rails (Focus + Insight) visible and interactive.
- [ ] Trigger **“Simulate Sequence”** CTA.
- [ ] Confirm:
  - Right rail collapses smoothly.
  - Sequence scene mounts with no flicker.
  - Header label updates to *Sequencer*.
  - Project context (`project_id`) persists.
  - Graph node colors remain domain-correct.

#### 2. Sequence → ROI/TCC Transition
- [ ] Open Insights rail → select **“Evaluate ROI/TCC”**.
- [ ] Confirm:
  - Graph overlay fades out cleanly.
  - ROI summary slides in on right rail.
  - Data consistency: ROI values sourced from same Sequencer dataset.
  - No reload of project or harmonized graph.

#### 3. ROI/TCC → Intelligence Reports
- [ ] Click **“Generate Org Intelligence.”**
- [ ] Confirm:
  - Intelligence scene mounts without delay.
  - ROI metrics persist.
  - Sidebar highlights *Intelligence* correctly.
  - ALE telemetry logs `scene_change` event.

#### 4. Intelligence → Digital Twin Loopback
- [ ] Select **“Return to Ecosystem View.”**
- [ ] Confirm:
  - Digital Twin scene restores to last saved state.
  - Graph renders full harmonized view.
  - Sequence/ROI overlays cleared.
  - No duplicate nodes or canvas reloads.

---

### 🧮 Data & Telemetry Validation
- [ ] `digitalEnterpriseStore` retains same node/edge set throughout transitions.
- [ ] ALE telemetry logs each `scene_change` with valid context payload.
- [ ] Verify single instance of graph canvas remains mounted per cycle.
- [ ] Validate ALE → Sequencer → Scene linkage integrity.

---

### ⚙️ Performance Targets
| Metric | Target | Validation Method |
|--------|---------|------------------|
| Scene load time | < 1.5s | Record w/ Chrome DevTools Performance tab |
| Graph re-render time | < 400ms | Profile React components |
| Memory delta | < 20MB | Compare pre/post GC snapshot |
| FPS on transition | ≥ 55fps | Monitor frame graph |

---

### 🚀 Promotion Criteria
- [ ] All scene transitions validated with zero errors.
- [ ] ALE logs complete telemetry chain.
- [ ] Graph rendering stable for ≥ 3 cycles.
- [ ] Performance metrics within thresholds.
- [ ] Reviewed and signed off by **Agent Z (Bill)** and **dx**.

Once validated, this directive is cleared for promotion to production in branch:
**`feature/086d_scene_transition_test_plan` → `main`**  
**Dependencies:** D086A (Twin Simplification), D086B (Sequence Template), D087F (Scene Template Refactor)

