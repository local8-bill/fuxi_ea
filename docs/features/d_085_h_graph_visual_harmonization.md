## 🧭 Directive D085H — Graph Prototype Visual Harmonization (Sprint 1)

### 🎯 Objective

Establish a clean, consistent, and low-cognitive-load visual layer for the **Graph Prototype**, focusing on typography, contrast, and panel clarity **without modifying the graph’s internal layout or data structure**.

> Goal: Enhance readability and aesthetic harmony while preserving existing node spacing, alignment, and coordinate logic.

---

### 🧱 Scope

**Included:**
- Typography harmonization (fonts, weights, line height)
- Color palette normalization (edges, text, pills, and cards)
- Card/panel structure (consistent radii, shadows, and spacing within panels)
- Tag and pill hierarchy (consistent size, font, and icon alignment)
- Visual contrast improvements for accessibility and clarity

**Excluded:**
- Any ReactFlow / dagre / layout recalculations
- Node positioning or coordinate changes
- Graph physics, spacing, or pan/zoom behavior
- Edge routing logic or relationship line geometry

---

### 🧱 Graph Layout Guardrails (Non-Functional Exclusions)
This directive **does not** modify:
- Node or edge spacing, alignment, or coordinates
- ReactFlow layout or dagre/simulation parameters
- Graph zoom, pan, or drag behavior
- Any positional logic within the data model

All adjustments are **strictly cosmetic** — typography, color, panel treatment, and non-graph padding only.

---

### 🖋️ Typography & Style Standards

| Element | Style | Notes |
| -------- | ------ | ----- |
| **Primary Font** | `Inter`, `sans-serif` | Consistent across UI and graph panels |
| **Font Weights** | 400 (regular), 600 (semibold) | No italics or gradient text |
| **Font Sizes** | `sm` (tags), `base` (body), `lg` (titles) | Scaled via Tailwind tokens |
| **Line Height** | 1.4 – 1.6 | Improve text legibility within graph cards |
| **Color** | `text-neutral-900` on `bg-neutral-50` | Maintain WCAG AA contrast |

---

### 🎨 Color Palette Normalization

| Use | Class | Notes |
| ---- | ----- | ----- |
| Background | `bg-neutral-50` | Remove gradients, subtle flat tone |
| Borders | `border-neutral-200` | Consistent 1px border for all panels |
| Text | `text-neutral-900` | Dark mode future-proofing |
| Tags / Pills | `bg-neutral-100 text-neutral-700` | Use one style for all domains |
| Highlights | `bg-primary-50 text-primary-700` | Reserved for active or selected nodes |

---

### 🧩 Implementation Guidance

1. Limit CSS overrides; prefer Tailwind utility classes.
2. Adjust only **internal panel structure** (padding, typography, icons).
3. Maintain all `data-id` and `data-coord` attributes to preserve graph hydration.
4. Ensure any visual state changes (hover, focus, active) are purely CSS-driven.
5. Reuse color tokens from `/theme/colors.ts` — no ad-hoc hex codes.

---

### 🧾 QA / Merge Validation Checklist

| Check | Expected Behavior |
| ------ | ----------------- |
| **Spacing** | No node or edge displacement between commits |
| **Typography** | Consistent font weight/size hierarchy applied across all graph panels |
| **Contrast** | Meets WCAG AA contrast ratios |
| **Consistency** | Pills and tags share unified color and padding structure |
| **Responsiveness** | Visual alignment intact across screen sizes |

---

### 📓 Progress Log

**2025-12-?? (dx)**
- Added a dedicated `graph-prototype-theme` wrapper on the dev scene so harmonization can be scoped without touching the live Digital Twin experience.
- Introduced semantic data attributes (`data-graph-node`, `data-graph-panel`, `data-graph-button`, `data-graph-overlay`) across shared graph components to enable targeted styling overrides.
- Applied the sprint palette/typography rules via `globals.css`, delivering glassy panels, unified pills, and high-contrast node cards that match the spec while preserving graph layout logic.

---

### ♻️ Rollback Procedure

If at any point visual regression or layout drift is detected:

1. **Identify Commit:** Use `git log --oneline` to locate the latest harmonization commit (`feature/graph-visual-harmonization-s1`).
2. **Checkout Safe Baseline:**
   ```bash
   git checkout main -- src/components/graph/
   git checkout main -- src/app/dev/graph-prototype/
   ```
   This restores all graph UI code to its pre-harmonization state.
3. **Rebuild Local Cache:** Remove cached build artifacts to clear potential style inconsistencies.
   ```bash
   rm -rf .next && npm run build
   ```
4. **Verify:** Confirm that all node coordinates, edges, and labels appear identical to the baseline snapshot (`oms_full_backup_2025-12-10.json`).
5. **Reapply Styles Safely:** If only minor typography fixes are desired, reapply them in a dedicated `style-only` commit after rollback.

Rollback must result in a visually identical graph to the original pre-harmonization state with no functional or layout drift.

---

### ✅ Sprint Completion Criteria

- Harmonized visual style across all graph panels and node cards.
- Typography and colors standardized per table above.
- Verified no visual regression in graph coordinates or relationships.
- QA checklist and rollback validation approved by Bill + dx.

---

**Branch:** `feature/graph-visual-harmonization-s1`  
**Approvers:** Bill (Architect), dx (Frontend)  
**Duration:** 1 sprint (3–5 working days)  
**Dependencies:** D082B, D084C  
**Non-Blocking:** Safe for concurrent sequencing work.
