## Directive 0011: Capability Scoring Workspace 2.0

### Purpose
Redesign the existing Capability Scoring Workspace to improve usability, engagement, and visual hierarchy while maintaining all functional integrity. This update should transform the experience from a static form-driven UI into a guided, structured workflow that reflects the Fuxi EA design principles and modern UX flow patterns.

**Status:** ✅ Completed

---

### Objectives
1. Simplify the core workflow into a clear 3-step sequence: **Import → Score → Visualize.**
2. Establish strong visual hierarchy with clear sectioning and progressive disclosure.
3. Replace isolated buttons and forms with contextual toolbars and inline interactions.
4. Maintain full compatibility with existing capability data schemas.
5. Provide a foundation for future AI-assisted scoring and recommendations.

---

### UX & Interaction Overview

#### 1. Layout Structure
- **Header Section:**  
  - Title: *Capability Workspace* — User can: Import, View, Edit, Create (New), then choose to Score  
  - Subtext: *Score business capabilities, compare domains, and explore AI-assisted insights.*  
  - Scope Bar: Project selector + domain filter + progress indicator (Import → Score → Visualize).

- **Body Sections:**  
  1. **Import Panel** – primary entry point for CSV/JSON uploads.
     - Dropzone-style upload zone with drag/drop and helper text.
     - Inline file validation (type, size, schema match).
     - Parsing preview modal (rows, columns, detected hierarchy).
  2. **Scoring Panel** – appears post-import or after manual add.
     - Inline cards for each capability (L1/L2).  
     - Score chips (color coded: Red = Gap, Amber = Neutral, Green = Strong).  
     - Contextual toolbar: [Add Capability] [Adjust Weights] [Filter].
  3. **Visualization Panel** – displays aggregated metrics and heatmaps.
     - Simple charts (bar, radar, bubble) via Recharts.
     - View toggles: Domain Summary | Capability Heatmap | Readiness Overview.

---

### Visual & Style Direction
- White-slate minimal layout consistent with new Fuxi aesthetic.
- Clear grid alignment, generous whitespace, and single CTA per section.
- Consistent button set (primary, ghost, icon-only).  
- Empty-state cards use friendly guidance copy, e.g., *“Import your first capability map to begin scoring.”*
- Use neutral palette (white/slate/gray) with one accent color per state.

---

### Implementation Plan (for Codex)
1. **Branch:** `feat/d011_capability_workspace_redesign`
2. **Core Files:**
   - `src/app/capabilities/page.tsx` → overhaul layout.
   - `src/components/capabilities/CapabilityCard.tsx` → reusable inline card.
   - `src/components/capabilities/ImportPanel.tsx` → dropzone uploader.
   - `src/components/capabilities/ScorePanel.tsx` → list + scoring logic.
   - `src/components/capabilities/VisualizationPanel.tsx` → Recharts hooks.
3. **Persistence:** maintain compatibility with `.fuxi/data/capabilities.json`.
4. **Testing:** ensure existing import/export still functions post-redesign.

---

### Comment Layer (for Collaboration)
Use this section to annotate specific design or logic concerns. Each comment can be linked to a section header for reference.

| Section | Comment | Action Needed | Status | Author |
|----------|----------|----------------|---------|---------|
| Header Section | Consider aligning title + subtext left; add small logo or project tag for context | Design alignment | ☐ | Bill |
| Import Panel | Add visual dropzone preview mockup; clarify supported formats | Add design spec | ☐ | Bill |
| Scoring Panel | Review chip color contrast for accessibility (AAA compliance) | Accessibility check | ☐ | Fuxi |
| Visualization Panel | Test chart responsiveness; verify grid adapts on mobile | QA review | ☐ | Codex |
| Overall Layout | Ensure 16px base spacing scale and consistent vertical rhythm | Design system check | ☐ | Mesh |

---

### Success Criteria
- Clear user flow (Import → Score → Visualize).
- Consistent component behavior and visual hierarchy.
- 100% feature parity with legacy workspace.
- Positive feedback in internal usability test (5/5 clarity metric).

---

### Verification & Validation Table

| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Workflow Integrity | Import → Score → Visualize operates without dead ends | ☐ | Codex |  |
| Data Schema Compatibility | Old data imports render correctly in new layout | ☐ | Fuxi |  |
| UI Consistency | All components follow Fuxi EA design standards | ☐ | Mesh |  |
| Empty State UX | Displays clear onboarding guidance | ☐ | Codex |  |
| Visual Clarity | Visual hierarchy and spacing verified against spec | ☐ | Fuxi |  |
| Functionality Parity | Legacy scoring actions preserved | ☐ | Codex |  |
| Build Validation | Compiles without errors | ☐ | Mesh |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-25  
- **Type:** UX/Interaction Directive  
- **Priority:** High  
- **Feature Branch:** `feat/d011_capability_workspace_redesign`  
- **Auth Mode:** Disabled (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D011_capability_workspace_redesign.md`
