## Directive D086 Sprint Roadmap – Core UX and Graph Stabilization

### 🧭 Objective
Unify the Digital Twin → Sequencer experience, stabilize OMS graph data, and complete the Shadcn transition in a clean, linear sequence. No creative deviations or feature expansion — this sprint focuses purely on structure, clarity, and performance.

---

### 🧩 Execution Order

#### **1️⃣ D086A – Digital Twin / OMS Scene Stabilization**
- **Objective:** Lock the core experience (graph + OMS data + Twin → Sequencer bridge).
- **Tasks:**
  - Clean up harmonized data (no ghosts, consistent domains).
  - Normalize node grammar and system state logic.
  - Verify snapshot → refresh flow consistency.
- **Done when:** Graph looks correct, scene transitions smoothly, and the harmonized data pipeline works end-to-end.

---

#### **2️⃣ D086B – Graph UX Simplification + Template Wiring**
- **Objective:** Move prototype to Shadcn-based layout template.
- **Tasks:**
  - Implement minimal Shadcn skeleton (Scene + Rails + Graph container).
  - Remove all legacy prototype CSS, pills, and gradients.
  - Add placeholder for “Build a Sequence” dialog (no logic yet).
- **Done when:** Graph renders cleanly in new shell using standard components only.

---

#### **3️⃣ D086C – Sidebar + Iconography Standard**
- **Objective:** Unify navigation (left + top) under Shadcn components.
- **Tasks:**
  - Apply 240 px sidebar normalization globally.
  - Run breakpoint verification checklist (1920 → 768 px).
  - Validate chevrons, theme toggle, and icon pack consistency.
- **Done when:** All scenes share the same sidebar + header, with no overlap or layout shift.

---

#### **4️⃣ D086B (Deferred) – Shadcn Refresh + Visual Polish**
- **Objective:** Re-enable theme and variant exploration once the core flow is stable.
- **Status:** Deferred until D086A–C complete.

---

### 🧱 Branches & Owners
| Branch | Owner | Status |
|---------|--------|---------|
| `feature/d086a_oms_scene_stabilization` | dx | In progress |
| `feature/d086b_graph_ux_template` | dx | Pending wiring |
| `feature/d086c_sidebar_standardization` | dx | Testing width normalization |

---

### ✅ Completion Criteria
- OMS graph, Digital Twin, and Sequencer share consistent layout + behavior.
- Shadcn-based template verified and responsive.
- Sidebar and iconography standardized at 240 px width.
- No duplicate CSS, no ghost components, no prototype overlap.

**Approvers:** Bill (Agent Z), dx  
**Tracking Folder:** `docs/features/086/`

