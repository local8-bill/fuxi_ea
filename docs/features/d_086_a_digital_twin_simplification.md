## Directive D086A – Digital Twin Scene Simplification (Twin → Sequencer Transition)

### 🎯 Objective
Simplify and streamline the **Digital Twin** experience, transforming it from a dense analytical map into a clear, cinematic visualization. This directive defines the UX foundation for transitioning from *Digital Twin* (understand) to *Sequencer* (simulate) without backend or data model changes.

---

### 🧭 Core Goals
| Area | Objective | Implementation Rule |
|------|------------|----------------------|
| **1. Layout Simplification** | Reduce cognitive load and visual clutter. | Collapsible side rails (left = Focus/Navigation, right = Insights/Inspector) controlled by < and > arrows pinned to the screen edge. |
| **2. Canvas Priority** | The graph is the product. | ReactFlow canvas expands dynamically to full width when both rails are collapsed. |
| **3. Node Hierarchy** | Make hierarchy and relationships instantly legible. | Use domain group bands and scale nodes by importance (impact, degree). Maintain clean spacing and remove redundant lines. |
| **4. Typography & Color** | Standardize visuals across app. | Use UXShell font system, remove gradients, and rely on neutral greys with minimal domain accent hues. |
| **5. Scene Transition** | Enable Twin → Sequencer flow. | On pressing **Simulate Sequence**, fade the background, slide out rails, and reveal the timeline overlay. Node states animate forward to reflect sequencing. |
| **6. Persistence** | Preserve continuity across scenes. | Node IDs and links persist; only state (phase, ROI color, readiness) mutates between modes. |

---

### 🚫 Non-Goals
- No backend or API modifications.
- No new hooks or telemetry events.
- No spacing or algorithmic layout changes *within* the graph cluster logic (reserved for later UX sprint).

---

### ⚙️ Deliverables
1. Updated **GraphCanvas** with collapsible rails and slide animation.
2. Simplified node card style and size (consistent shape and font hierarchy).
3. Scene transition mock (fade → timeline overlay).
4. Centralized style constants for graph typography, color, and padding.

---

### ✅ Success Criteria
- Graph readability improves by 40% (user perception testing).
- Median interaction time in Digital Twin exceeds 15 seconds.
- Smooth transition between Twin and Sequencer scenes with no layout shift.
- Rails toggle without impacting node interactivity or zoom.

---

### 🔄 Branch & Ownership
**Branch:** `feature/d086a_twin_simplification`  
**Approvers:** Bill (Architect Z), dx  
**Dependencies:** None — front-end only.  
**Future Link:** D086B — Inventory / Harmonization Integration.

---

### 🧱 Visual Wireframe (Reference Only)
```
┌──────────────────────────────────────────────────────────────┐
│ Top Bar: Mode / Commands / Feedback                          │
├─────────────┬───────────────────────────────┬────────────────┤
│ <  Focus    │       Hero Graph Canvas       │    Inspector  >│
│  Domains     │   (ReactFlow Visualization)   │  Node Details  │
│  Scenarios   │   ▸ Digital Twin Scene        │  Insights      │
│  Projects    │   ▸ Transition to Sequencer   │  Actions       │
├─────────────┴───────────────────────────────┴────────────────┤
│ Timeline Overlay (Sequencer Mode only)                       │
└──────────────────────────────────────────────────────────────┘
```

---

### 🧪 QA Checklist for dx

| Step | Verification | Expected Outcome |
|------|---------------|------------------|
| 1 | Collapse left and right rails using arrows | Rails slide smoothly; faint arrow remains visible on edge. |
| 2 | Expand both rails again | Graph canvas reflows correctly, no overlap or jitter. |
| 3 | Trigger scene transition (Simulate Sequence) | Fades to Sequencer mode, timeline overlay visible, nodes animate. |
| 4 | Toggle between Twin ↔ Sequencer repeatedly | No residual artifacts, animation performance > 50 fps. |
| 5 | Test typography and colors | Matches UXShell spec (no gradients, consistent font weights). |
| 6 | Node hover + drag | Behaviors remain unchanged; rails do not interfere with graph controls. |
| 7 | Zoom and pan | Functions normally at all rail states. |
| 8 | Cross-browser | Confirm consistent rendering in Chrome, Edge, Safari. |

---

**QA Signoff:** Pass required on all above tests before merging to `feature/d086a_twin_simplification`.  
**Rollback Procedure:** If regressions occur, revert `GraphCanvas`, `GraphScene`, and `LayoutConstants` to snapshot `safety/graph-prototype-snapshot`.  

---

### 📓 Progress Notes (2025-12-??)
- **Rails + Canvas flow:** Collapsible focus/insights rails wired into `DigitalEnterpriseClient.tsx` with edge chevrons and opacity transitions; confirmed the canvas expands when either lane is hidden. No layout jitter observed while toggling or when viewport resizes.
- **Graph canvas rework:** `GraphCanvas.tsx` now supports caller-provided sizing (columns, gaps, fitView padding) and the Digital Twin scene passes the tighter layout spec, giving consistent domain spacing and stable zoom defaults.
- **Scene transition path:** Sequencer controls and predictive panels sit in the right rail with the fade/slide animation. Simulate + play/step flows drive the same sequence array that feeds the ReactFlow badges, so nodes carry forward when switching modes.
- **Telemetry:** Existing `useGraphTelemetry` hooks record focus/mode/stage, and pan/zoom instrumentation fires per move. No additional events were added per directive (non-goal).
- **Outstanding polish:** Active phase (FYxx) pill still inherits a muted tint when the prototype theme loads; keep an open task to re-style that button without regressing the Digital Twin palette. Cross-browser pass pending once color tweaks land.
