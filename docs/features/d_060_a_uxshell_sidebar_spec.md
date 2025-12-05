### 🧭 Directive D060A – Unified UXShell Sidebar Structure (Final)

#### Purpose
Define a **consistent, hierarchical, collapsible sidebar** pattern for all entities — *Projects, Views,* and *Modes* — ensuring consistent spacing, typography, and interaction. This is now the canonical sidebar structure for Fuxi’s Unified Experience Shell.

---

### 📐 Canonical Sidebar Structure

```
▾ Projects
   700am — Core                  LIVE
   951pm — Pilot                 DRAFT
   Demo Workspace                DEMO
   + New Project

▾ Views
   ▾ Σ ROI
      ROI 1 (Hypothesis)
      ROI 2 (Actuals)
      ROI 3 (Scenario B)
      + New ROI

   ▸ + Graph
   ▸ ⇄ Sequencer
   ▸ ✓ Review
   ▸ ∞ Digital Enterprise

▾ Modes
   Architect
   Analyst
   CFO
   FP&A
   CIO
```

---

### 🧩 Visual & Interaction Standards

| Element | Behavior | Notes |
|----------|-----------|-------|
| **Expanders (▸▾)** | One-click toggle | Persistent across sessions (localStorage or DB) |
| **Active item** | Highlight: `bg-neutral-900 text-white` | Applies only to leaf nodes |
| **Inactive** | Hover: `bg-neutral-100` | Maintain spacing even when collapsed |
| **Section headers** | Uppercase, 12px tracking-wider font | e.g., “PROJECTS”, “VIEWS”, “MODES” |
| **Icons** | Use system math-style symbols only (`Σ`, `+`, `⇄`, `✓`, `∞`) | No emoji |
| **Alignment** | Text left-aligned, status (LIVE, DRAFT, DEMO) right-aligned in lighter gray |
| **Spacing** | Vertical rhythm = 12px per line; 24px between sections |
| **Borders** | None; rely on whitespace for separation |
| **Animation** | Expand/collapse smooth 150ms ease-in-out |
| **Telemetry** | Emit `nav_section_toggled` and `nav_item_selected` on expand/click |

---

### 🧠 Implementation Notes

- Component: `components/layout/Sidebar.tsx`
- Shared state: `useUXShellStore` (Zustand or Context)
- Collapsed state key pattern: `sidebar_<section>_collapsed`
- Telemetry: `/lib/telemetry/navigation.ts`
- Persist selection across page reloads (active project, mode, and last-view state)

---

### ✅ Deliverable Acceptance (for Codex)
1. Sidebar visually matches this spec exactly.
2. Navigation state is persistent across reloads.
3. All telemetry events are firing.
4. No regressions in Command Deck or Insights panes.
5. Tag build as `UXShell v0.3` upon merge.

