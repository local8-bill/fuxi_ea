## Directive D086A – Graph Prototype UX Simplification

### 🌟 Objective
Simplify and harmonize the **Graph Prototype UI** to reduce cognitive load and enhance readability without changing backend logic, ReactFlow hooks, or data bindings.

---

### ⚙️ Scope
Applies only to the **Graph Prototype page** (`src/app/dev/graph-prototype/page.tsx`) and associated **layout components**.  
No modification to ALE, Sequencer, or graph data.

---

### 🧱 Design Intent
| Area | Change | Notes |
|------|---------|-------|
| **Typography** | Use single, consistent font family (shadcn base). Vary only by size and weight. | Remove mixed fonts and gradients. |
| **Color Palette** | Flat dark background (`#1E1E2E`), neutral node palette, accent color for selection. | Avoid gradients and saturated hues. |
| **Layout** | 3-column layout: Left Nav (240px), Graph Canvas (flex), Right Inspector (240px). | Both side panels collapsible. |
| **Interactions** | Add: Integration toggle (on/off), Collapse/Expand for lanes. | Display auxiliary data below canvas when both lanes are hidden. |
| **Performance** | No new hooks, libraries, or data fetches. | Maintain current FPS and render speed. |

---

### 🧩 Sprint Breakdown

**Sprint 1 – Visual Cleanup (Active)**  
🎯 **Goal:** Establish the visual consistency baseline.

**Tasks:**  
- [x] Replace all font references with `--font-shadcn` (weight 400 / 600).  
- [x] Remove gradient backgrounds, ensuring flat palette compliance.  
- [x] Normalize margins and padding (12px grid baseline).  
- [x] Audit label alignment in sidebar, inspector, and graph header.  
- [x] Test accessibility: color contrast (AA minimum), label visibility in dark mode.  
- [x] Create before/after screenshot diff for review (use `scripts/ui_diff_capture.sh`).  

**Progress Notes (DX · Sprint 1)**  
- Applied global `--font-shadcn` stack and rewired `/dev/graph-prototype` header + controls to the shadcn typography rhythm.  
- Replaced all remaining gradient fills on nodes/panels with the neutral palette tokens; domain/system cards now use flat borders only.  
- Locked page layout into the 3-column structure (nav · canvas · inspector) with a 12px spacing grid so Sprint 2 collapse controls have a stable baseline.  
- Established a shared label class so every left-rail control, inspector block, and timeline heading uses the same casing + spacing, eliminating the staggered baselines noted in QA.  
- Verified AA contrast for the new palette (white vs `#1E1E2E` → 16.4:1, neutral-600 vs `#f8fafc` → 7.24:1, neutral-500 vs white → 4.74:1) via a quick luminance script.  
- Captured the before/after/diff set via `scripts/ui_diff_capture.sh` → see `playwright-report/ui-diff/20251211-113624-graph-prototype-{before,after,diff}.png`.  

**Branch:** `feature/graph-ux-cleanup/sprint-1`  
**Owner:** dx  
**Reviewers:** Bill (Agent Z), Fuxi  
**Estimated Duration:** 1 working day  

#### 💻 CLI Helper
To track sprint tasks, use:
```bash
npm run task:uxclean
```
This command initializes a lightweight task checklist for Sprint 1 under `/scripts/tasks/uxclean.json` with progress markers.

Example output:
```
[ Sprint 1: Visual Cleanup ]
☐ Fonts normalized
☐ Gradients removed
☐ Spacing grid aligned
☐ Label alignment verified
☐ Accessibility tested
☐ Screenshot diff captured
```
Run `npm run task:uxclean --complete` to finalize and push status.

---

**Sprint 2 – Layout Controls (In QA)**  
- [x] Implement collapsible lanes with CSS-only transitions (left/right rails + aux rail fallback).  
- [x] Extend the integration overlay toggle so the canvas cards respond (hotspots + telemetry badges).  
- [x] Confirm responsive breakpoints + mobile stacking without breaking the 3-column desktop grid.

**Progress Notes (DX · Sprint 2)**  
- Converted the prototype grid to a fixed 3-track template with animated column widths, inert lanes, and delayed unmounts so collapse/expand feels smooth but keeps tab order clean.  
- Added a responsive `useMediaQuery("(min-width: 1024px)")` hook so the layout snaps to a single-column stack on tablets/phones while retaining the transition affordances on desktop.  
- Rebuilt the Integration Overlay control to drive domain/system badges (region coverage, hotspots, telemetry counts) instead of the old store-only chips, and piped the flag straight into each card + the ROI canvas banner.  
- Gated the auxiliary panels so they render under the canvas only after both lanes finish collapsing, preventing duplicate inspectors during the animation window.  
- Logged the Sprint 2 deltas here so the `task:uxclean` helper can be extended beyond the Sprint 1 checklist before QA sign-off.

**Sprint 3 – Review & Integration (Complete)**  
- [x] Validate consistent handoff between Prototype and UXShell scenes.  
- [x] QA accessibility contrast (AA+) for the overlay palette.  
- [x] Capture a fresh before/after Playwright diff for `/dev/graph-prototype`.

**Progress Notes (DX · Sprint 3)**  
- Broke out the shared layout controls (`GraphControlPanel` + `graphSectionLabelClass`) so both the prototype and the UXShell Digital Twin scene can use the same collapse, reveal-stage, and view-mode tooling without CSS drift.  
- Rebuilt the Digital Twin scene rail to mirror the prototype: left/right lanes now collapse with smooth transitions, the sequencer stack drops under the canvas when hidden, and the integration overlay state drives both the ReactFlow canvas and the new badge/breadcrumb copy.  
- Added `showIntegrationOverlay` plumbing to the production `GraphCanvas` + `GraphNode` so monitored-flow callouts, ROI badges, and the overlay banner stay in sync with the layout controls.  
- Re-checked the new overlay chips for AA contrast (`#0F172A` on `#F0FDF4` → 17.05:1, `#065F46` on `#F5F5F4` → 7.04:1, `#475569` on `#FFFFFF` → 7.58:1).  
- Captured the Sprint 3 baseline via `scripts/ui_diff_capture.sh` → `playwright-report/ui-diff/20251211-120557-graph-ux-sprint3-{before,after,diff}.png`.

---

### 🔧 Rollback Plan
If regressions occur:  
1. `git checkout safety/graph-prototype-snapshot`  
2. Revert `/components/graph/` and `/app/dev/graph-prototype/`  
3. Validate via `/api/digital-enterprise/view?project=700am&mode=all`  
4. Confirm Graph renders with previous node and phase layout.

---

### 🧠 Outcome
A focused, professional-grade visualization surface that feels like an architectural workspace, not a dashboard.

---

✅ **Branch:** `feature/graph-ux-cleanup`  
👥 **Approvers:** Bill (Agent Z), dx  
📎 **Dependencies:** none  
📅 **Next Step:** Directive complete — hand off to Sequencer/QA for D086B follow-ups
