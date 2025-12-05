## Directive 0002: Fuxi EA UI Wireframes v0.1

### Purpose
Implement the foundational page structure and user interface flow for the Fuxi EA product, based on the provided textual wireframes. This directive defines the routing, layout, and interaction model for key user paths without introducing new dependencies.

---

### Core Objectives
1. Scaffold core application pages using existing component libraries and Recharts.
2. Apply the Fuxi Design Language (FDL) to maintain a consistent look and feel across all pages.
3. Implement the UX flow defined in `/docs/features/wireframes.md`:
   - Home / Start
   - Intake
   - Tech Stack
   - Digital Enterprise
   - Portfolio
4. Maintain lightweight, performant UI behavior with no new dependencies.

---

### Implementation Plan (for Codex)
1. **Branch:** `feature/ui_wireframes_v0_1`
2. **Path:** `src/app/`
3. **Files to Create:**
   - `src/app/layout.tsx` (if not present)
   - `src/app/home/page.tsx`
   - `src/app/intake/page.tsx`
   - `src/app/tech-stack/page.tsx`
   - `src/app/digital-enterprise/page.tsx`
   - `src/app/portfolio/page.tsx`
4. **Components:**
   - `components/TopNav.tsx`
   - `components/ProgressStrip.tsx`
   - `components/HeroCard.tsx`
   - `components/UploadPanel.tsx`
   - `components/TableView.tsx`
   - `components/ImpactPanel.tsx`
   - `components/LaneCard.tsx`
5. **Data:**
   - Temporary mock JSON data under `src/mock/ui_data.ts` for placeholder content.
6. **Design:**
   - Follow layout, spacing, and color rules defined in Fuxi Design Language.
   - Use Tailwind + Recharts only.
   - Keep components simple and self-contained.
7. **Testing:**
   - Run `npm run build` to verify all routes compile successfully.
   - Check page-to-page navigation and progress indicator.

---

### Safety & Fallback
- Do **not** overwrite existing pages or components; create new ones as necessary.
- If layout errors occur, log details in `/mesh_prompts/completed/ui_wireframes_v0_1_error.log`.
- Ensure build passes before merging.

---

### Success Criteria
- All routes (Home, Intake, Tech Stack, Digital Enterprise, Portfolio) render correctly.
- Consistent visual design across pages.
- Progress strip navigation works.
- No dependency changes.
- Build passes with `npm run build`.
- Summary log output created in `/mesh_prompts/completed/ui_wireframes_v0_1_result.json`.

---

### Directive Metadata
- **Project:** fuxi_ea
- **Issued by:** EA Mesh (GPT-5)
- **Issued on:** 2025-11-25
- **Type:** Build Directive
- **Priority:** High
- **Source Spec:** `/docs/features/wireframes.md`
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_ea_ui_wireframes_v0_1.md`

