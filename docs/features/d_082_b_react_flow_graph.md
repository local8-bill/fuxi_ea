## 🧭 Directive D082B – React Flow Graph Implementation

### Purpose
Establish React Flow as the **canonical graph engine** for the Fuxi Digital Twin and related visualization scenes. This directive transforms the D082A visual prototype into a functional, interactive system integrated with EAgent, Guided Focus, and UXShell telemetry.

---

### ⚙️ Architecture Overview

**Core Components:**

| Component | Purpose |
|------------|----------|
| `GraphCanvas.tsx` | Main wrapper for `<ReactFlow />`; manages focus, view mode, reveal states, and integration with EAgent. |
| `GraphNode.tsx` | Custom node renderer supporting domain color themes, ROI overlays, glow on hover, and capability badges. |
| `GraphEdge.tsx` | Custom edge component using Bezier curves, soft opacity, and highlight-on-hover behavior. |
| `GraphControls.tsx` | Toolbar hosting Guided Focus and View Mode selectors (top left + top right of canvas). |
| `useGraphTelemetry.ts` | Hook emitting all graph-related telemetry (focus, mode, interaction, reveal). |
| `useGraphNarration.ts` | Hook enabling EAgent to narrate context and state changes (e.g., “Now highlighting Finance domain”). |

---

### 🧩 React Flow Configuration

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={{ fuxiNode: GraphNode }}
  edgeTypes={{ fuxiEdge: GraphEdge }}
  fitView
  minZoom={0.3}
  maxZoom={1.5}
  defaultEdgeOptions={{ type: 'fuxiEdge' }}
  onNodeClick={handleNodeClick}
  onMove={handlePanZoom}
  onInit={setFlowInstance}
/>
```

State management via `useUXShellStore` ensures consistency across scenes. Data is passed via `digital_twin.json` mock or equivalent backend source later.

---

### 🧠 Guided Focus Integration

- **GuidedFocusTile:** updates visible node filters by domain, goal, or stage.
- **ViewModeSelector:** changes the overlay visualization (Systems, ROI, Sequencer, Capabilities).
- **EAgent Commands:**
  ```ts
  graphStore.setFocus("Commerce");
  graphStore.setViewMode("ROI");
  graphStore.revealStage(2);
  ```
  These actions trigger both React Flow animations and narration overlays.

---

### 📈 Telemetry Events

| Event | Description |
|--------|--------------|
| `graph_focus_changed` | When user or EAgent changes guided focus. |
| `graph_mode_changed` | When switching between System/ROI/Sequencer views. |
| `graph_stage_revealed` | When Reveal Stage transitions (0–3). |
| `graph_interaction` | Any zoom, drag, or selection gesture. |

---

### 🪄 Visual Treatments

- **Background:** muted gradient with low contrast.
- **Nodes:** rounded-2xl, soft glow hover, domain tint.
- **Edges:** curved lines, translucent; animate on reveal.
- **Clusters:** domain halos with subtle titles.
- **Mini-map:** bottom-right corner, auto-sync with focus.

---

### 🔄 Development Plan

| Phase | Deliverable |
|--------|--------------|
| **Phase 1** | Base React Flow integration, static mock data. |
| **Phase 2** | Guided Focus & View Mode interactivity. |
| **Phase 3** | EAgent narration + telemetry integration. |
| **Phase 4** | Data service connection + Sequencer alignment. |
| **Phase 5** | Capability mapping and learning engine hooks. |

**Branch:** `feature/d082b_reactflow_graph`

---

### 🔗 Reuse & Extension

This implementation pattern will be reused in:
- **Digital Twin Scene** (`scene=digital`)
- **Sequencer Scene** (`scene=sequencer`)
- **Capabilities Scene** (`scene=capabilities`)

---

### ✅ Acceptance Criteria
- React Flow graph renders with custom nodes/edges.
- Guided Focus and View Mode toggle dynamically.
- Telemetry events fire consistently.
- EAgent narration responds to user context.
- Performance stable at >60fps for up to 500 nodes.

---

### 🔐 Pre-D082B Prep – Branching & Merge Protocol

**1️⃣ Finalize Current Work**
```bash
git status
git add .
git commit -m "chore: finalize pre-D082B baseline"
git push origin <current-branch>
```

**2️⃣ Merge to Dev & Main**
```bash
# Ensure dev and main are aligned
git checkout dev
git pull origin dev
git merge <current-branch> --no-ff
git push origin dev

git checkout main
git pull origin main
git merge dev --no-ff
git push origin main
```

✅ *Outcome:* both `dev` and `main` contain the latest working UX shell, ROI, and Digital Twin features — clean and stable.

---

**3️⃣ Create the Graph Branch**
```bash
git checkout -b feature/d082b_reactflow_graph
```
This new branch is now dedicated solely to implementing **Directive D082B – React Flow Graph Implementation**.

---

**4️⃣ Guardrails**
- **No rebasing** onto `main` during this build — merge forward only.  
- **No cross-branch commits** from experimental UX work.  
- **No legacy graph code** migration — build clean from the new component spec.  
- Push regularly, tag `v0.1` when the graph renders, then attach Guided Focus and EAgent integration in `v0.2`.

---

**Approvers:** Fuxi & Agent Z (Bill)  
**Purpose:** Formalize the core React Flow graph engine as the living visualization foundation of the Fuxi Experience Shell.

