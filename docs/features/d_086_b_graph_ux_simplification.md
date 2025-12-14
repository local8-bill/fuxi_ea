## Directive D086B – Graph UX Simplification & Focus Mode (Sprint 3)

### 🎯 Objective
Refine the **Graph Prototype** into a production-ready “Architect View” that reduces cognitive load, standardizes font and layout systems, and introduces focus-driven interactions without touching underlying data or logic.

---

### 🧩 Scope

1. **Template Layout Integration**
   - Implement the **shared app template** (left nav, hero canvas, right inspector).
   - Left lane: collapsible global nav (240px default).
   - Right lane: contextual inspector (240px default).
   - Hero area: fills all remaining width; toggles to full-page “Focus Mode”.
   - Consistent header (mode / feedback / scene title).

   ✅ *Deliverable:* Template scaffold implemented via `LayoutState.ts` (no functional change).

---

2. **Typography and Color Harmonization**
   - Replace gradients and mismatched type with consistent text hierarchy:
     - H1 → 20 px / bold / #E4E4E7
     - H2 → 16 px / medium / #A1A1AA
     - Body → 14 px / regular / #D4D4D8
   - Standardize color tokens under `theme.css` (base, accent, background).
   - Use **shadcn/ui** primitives for buttons, panels, and inputs.

   ✅ *Deliverable:* Unified font and palette system; drop gradients entirely.

---

3. **Interaction Simplification**
   - Add a **“Collapse Lanes”** button → hides both nav & inspector for full-screen graph.
   - Add an **“Integrations Toggle”** → toggles visibility of secondary/indirect systems.
   - Introduce subtle animations for domain transitions (0.3 s fade).
   - Keyboard shortcuts:
     - `F` → Focus Mode
     - `I` → Toggle Integrations
     - `L` → Collapse/Expand Lanes

   ✅ *Deliverable:* New micro-interactions tested and documented.

---

4. **Information Density and Hierarchy**
   - Group systems under expandable **domain headers** (“OMS”, “Finance”, “Commerce”).
   - Limit visible node depth (default: 3); expand on click.
   - Add small domain icons to visually differentiate types.
   - Simplify legend to a one-line color key.

   ✅ *Deliverable:* Simplified node presentation + progressive disclosure UX.

---

5. **Docs + Command Beans**
   - New beans:
     ```bash
     npm run dev:focus         # Launch Graph Prototype in focus-only mode
     npm run dev:theme:verify  # Validate color and typography tokens
     npm run dev:inspect:lane  # Preview inspector interactions
     ```
   - Update `docs/features/d_086_b_graph_ux_simplification.md` with Figma references and theme tokens.

---

### 🧾 Completion Criteria
| Area | Deliverable | Owner |
|------|--------------|--------|
| Template | 3-column collapsible layout live | dx |
| Theme | Font + color harmonization complete | dx |
| Interactions | Keyboard + toggles functional | dx |
| Docs | Beans + theme documentation written | Agent Z |
| QA | Cognitive load test (≤ 7 visual clusters) | Agent Z |

---

### 📁 Branching
```
feature/graph-ux-simplification
feature/focus-mode
docs/sprint3_dx
```

---

### 🕓 Duration
**Start:** Dec 18 2025  
**End:** Dec 27 2025  
**Review:** Dec 29 2025 — focus on readiness for D087 (Sequencer-ROI Sync)

---

**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D086A (OMS Stabilization), D085A (Sequencer), D085C (Org Intelligence Reports)

---

### 📓 Progress Notes (2025-12-??)
- **Sequence builder template:** prototype page now mounts inside `UXShellLayout` with a reusable sidebar (NavSection) for scene switching + domain drill downs, a hero canvas column, and the inspector rail. Added global nav collapse state + keyboard shortcut (`L`) to hide the nav on demand.
- **Focus interactions:** Introduced Focus Mode / Collapse Lanes control that hides both focus + inspector rails, wired to keyboard shortcuts (`F` for focus mode, `I` for integrations, `L` for nav). GraphCanvas gained sizing presets plus a system-depth limiter so only the top 3 nodes render per domain until expanded.
- **Progressive disclosure:** Domain-focused panel + sidebar toggles now control `expandedDomains`, piping into GraphCanvas so condensed headers show hidden counts and icons.
- **Dev ergonomics:** Added `npm run dev:focus`, `npm run dev:inspect:lane`, and `npm run dev:theme:verify` plus beans updates; theme verify script ensures the new `.graph-prototype-theme` selectors stay in sync.
