# D061: UXShell Interaction Framework

## 🎯 Purpose & Vision
The **UXShell** is the unified, role-driven command environment for the Digital Enterprise platform. It consolidates navigation, role modes, and insight presentation into a single adaptive workspace.

The UXShell is *not* a view layer or a dashboard — it is the **command deck** of the enterprise. It orients, contextualizes, and directs users toward high-value actions.

> **Design Law #1:** The Start Page is a Command Deck — not a Viewport.
> Never render the full graph or analysis view on load. The shell orients, the views visualize.

---

## 🧭 Navigation Hierarchy

### 1. Projects
- Sidebar anchor.
- Displays current and recent projects.
- Includes quick action: **+ New Project**.
- Loads the latest context for the selected project.

### 2. Views
- Represent the major workspaces of the Digital Enterprise platform.
- **Graph, ROI, Sequencer, Review, Scenario Modeler, Digital Enterprise.**
- Accessible via contextual buttons in the sidebar or workspace header.

### 3. Modes
- Represent *roles* or *personas* within the project.
- **Architect, Analyst, FP&A, CFO, CIO.**
- The active mode determines which insights, metrics, and visual treatments appear in context.

---

## ⚙️ Interaction Rules

### Start Page Behavior
- On load, UXShell renders the selected project and user mode summary.
- Surfaces: **context**, **status indicators**, and **next best actions**.
- No heavy visuals (graphs, charts, or maps) are loaded at this stage.
- Prioritizes speed and orientation.

### View Transition
- Clicking a view (e.g., *Graph*, *ROI*, *Sequencer*) loads the full, interactive environment.
- Maintain shell context (project/mode) during view switch.
- Always preserve navigation state and re-entry memory.

### Role Awareness
- Each mode tailors labels, metrics, and recommended paths.
  - *Architect*: Systems, dependencies, readiness.
  - *Analyst*: Insights, data patterns, anomalies.
  - *FP&A*: ROI, savings, cost avoidance.
  - *CIO*: Risk, consolidation, modernization progress.

### Data Context
- UXShell persists data context between views.
- Example: Selecting a domain in Graph auto-filters relevant ROI and Sequencer data.

---

## 🎨 Behavioral Design Principles

### 1. Clarity
Every element on screen answers one of two questions:
- *Where am I?*
- *What can I do next?*

### 2. Persistence
The shell remembers user state — project, mode, filters — across sessions.

### 3. Adaptability
UX adapts by role and available data. Empty states gracefully guide to next steps.

### 4. Speed
No view transition or load should exceed 2 seconds. Lightweight data previews only.

### 5. Delight
Subtle animations, hover states, and micro-interactions reinforce quality and momentum.

---

## 🚦 Implementation Handoff Guide

### API Hooks
- `/api/projects/context` – fetch project, mode, and status metadata.
- `/api/navigation/state` – persist view/mode state.
- `/api/insights/summary` – retrieve current mode summaries (ROI, readiness, risk, etc.).

### Telemetry
- `uxshell_loaded`
- `uxshell_view_selected`
- `uxshell_mode_changed`
- `uxshell_action_invoked`

### Integration Notes
- UXShell replaces `/project/[id]/digital-enterprise` as the unified entrypoint.
- Graph engine (React Flow) launches from within Shell.
- ROI and Sequencer integrate via unified insight panel (right rail).

---

## 📘 Next Steps
1. Finalize wireframe alignment with Codex (shell layout + persistent right rail).
2. Implement lightweight project context API.
3. Add role-based insight summaries.
4. Wire telemetry events.
5. Prepare D062 directive for Team UX Collaboration mode (multi-user extension).

---

## 🧩 Active Sprint Overview

| Status | Directive | Focus | Owner |
|:--|:--|:--|:--|
| ✅ | D051A | ROI Dashboard (shipped) | Codex |
| 🟡 | **D052** | ROI Stabilization + Architect Experience | Codex (finish/QA) |
| 🟡 | **D060 / D061** | Unified UX Shell (start page + navigation + mode logic) | Fuxi (with Codex handoff) |
| ⚙️ | **D047A** | React Flow HAT + Graph Visual Polish | Codex |
| ⚙️ | **D053** | Digital Twin Interface Wireframe (UX prototype) | Fuxi |
| ⏸️ | D034/D040 | Sequencer & Transformation Dialogue | Paused until ROI + UX stable |
| ⏸️ | D041/D037 | Graph Overhaul / Cytoscape | Archived superseded by React Flow |