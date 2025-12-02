## Directive D050 — Fuxi Web Framework Modernization

### Summary

This directive establishes the foundation for **Fuxi Web v2**, introducing a tri-pane adaptive layout framework for all major workspaces (Tech Stack, Ecosystem, ROI, Sequencer, Mesh). The new framework emphasizes continuity, clarity, and collaboration — providing persistent navigation, modular insight panels, and a flexible center workspace canvas.

---

### Goals

- Unify Fuxi UX into a **consistent, modern workspace layout**.
- Support real-time collaboration with Codex, Mesh, and HAT workflows.
- Enable seamless context switching between graph, table, and chat views.
- Deliver a clean, high-performance UI inspired by modern AI tools (e.g., OpenAI Pro workspace).

---

### Layout Architecture

#### 1. **Tri-Pane Framework**

| Section | Description | Example Components |
|----------|--------------|--------------------|
| **Left Nav (Navigation Pane)** | Persistent global navigation | Project selector, view switcher (Intake / Stack / Ecosystem / ROI / Mesh), active project summary |
| **Center Workspace (Canvas Pane)** | Primary workspace canvas | Cyto Graph, ROI Charts, Transformation Sequencer, Table view |
| **Right Context (Insight Pane)** | Contextual side panel for AI, telemetry, or HAT | Codex / Mesh chat, ROI summary, Telemetry logs, AI suggestions |

The tri-pane layout persists across all pages, with lazy loading per workspace for performance.

---

### Framework Design

#### 2. **Adaptive Layout Engine**
- Built with **Next.js 16 + React 19 + Tailwind Grid Layouts**.
- Uses a unified `<FuxiLayout>` component with named slots:
  ```tsx
  <FuxiLayout>
    <FuxiNav slot="left" />
    <FuxiCanvas slot="center" />
    <FuxiInsight slot="right" />
  </FuxiLayout>
  ```
- Auto-resizes and animates transitions via **Framer Motion**.
- Mobile and tablet responsive (collapsible left and right panes).

---

#### 3. **Left Navigation Pane**
- Persistent vertical sidebar.
- Includes:
  - Workspace navigation (Domain, Integration, Disposition, AI, ROI)
  - Project picker (dropdown + search)
  - Quick actions: Upload, New Project, Settings
  - Compact status indicators (Telemetry, Codex link state, Mesh sync)
- Supports keyboard shortcuts (⌘1–⌘5 for workspace jumps).

---

#### 4. **Center Workspace Pane**
- Dynamic content surface.
- Switchable between:
  - **Graph mode:** (Cytoscape or SBGN) for enterprise visualization.
  - **Table mode:** (React Table) for structured CSV or harmonized data.
  - **Timeline/ROI mode:** integrated with D043A slider + charts.
- Shared context API for telemetry, filters, and overlays.
- Fit-to-space defaults and layout presets (SBGN / Dagre / Cose / Custom).

---

#### 5. **Right Insight Pane**
- Modular contextual workspace.
- Uses tabbed sections:
  - **AI / Mesh Chat** — conversation with Codex or Mesh agents.
  - **ROI / Impact Summary** — details for selected system or ROI forecast.
  - **Telemetry / Events** — live event stream and performance metrics.
- Supports pinning insights or undocking as floating panels.

---

### System Design Principles

1. **Continuity:** The workspace retains context when switching panes (graph → ROI → chat).  
2. **Transparency:** Every AI suggestion, inference, or Codex action is visible in the insight panel.  
3. **Speed:** Transitions < 150ms, layout renders < 1s for 250-node graphs.  
4. **Resilience:** Graceful degradation if Mesh or telemetry offline.  

---

### Integration Points

| Module | Integration | Notes |
|---------|--------------|-------|
| **Cyto Graph (D041)** | Canvas pane | Uses fit-to-space and stage transitions |
| **Timeline (D043A)** | Bottom overlay | Synchronized across modes |
| **ROI Forecast (D046)** | Insight pane + canvas chart | Live-updating model |
| **Transformation Sequencer (D040)** | Canvas workspace | Sequencer as main view |
| **Mesh / Codex (D049)** | Insight panel | Real-time collaboration channel |

---

### Developer Framework

- Base component: `/components/layout/FuxiLayout.tsx`
- Utility hooks:
  - `useFuxiContext()` — shared state for navigation, graph, ROI, and AI.
  - `useTelemetry()` — logs UI + system events.
- Theme and style defined in `/styles/fuxi-theme.css`.
- Panel state persisted via `localStorage` + telemetry cache.

---

### Success Criteria

- ✅ Consistent tri-pane layout across all workspaces.
- ✅ Canvas area fully interchangeable between modes.
- ✅ Insight pane supports Codex + ROI + Telemetry modules.
- ✅ Sub-second render and pane transitions.

---

### Next Steps

- Implement `<FuxiLayout>` and integrate into `/app/project/[id]/layout.tsx`.
- Migrate existing Ecosystem, ROI, and Mesh pages into layout slots.
- Implement persistent nav state and context sync.
- Prepare style/theme modernization in **D051 — UI Theming and Visual Design Refresh**.

