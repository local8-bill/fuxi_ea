## Directive 0002a: Knowledge Domain Setup

### Purpose
Establish a structured domain layer within Fuxi EA for storing and maintaining reusable business logic artifacts, analytical frameworks, and scoring models. This domain will serve as the foundation for future reasoning engines, such as the AI Opportunity Engine (Directive 0003).

**Status:** ✅ Completed

---

### Objectives
1. Create a consistent repository structure for analytical and reasoning logic.
2. Prepare the workspace for ingestion of AI scoring models, frameworks, and reference data.
3. Maintain separation of concerns—no coupling with UI or API layers.

---

### Implementation Plan (for Codex)
1. **Branch:** `feat/d002a_knowledge_domain_setup`
2. **Path:** `src/domain/knowledge/`
3. **Subdirectories:**
   - `ai_primitives/` → definitions and examples of AI use case primitives.
   - `impact_effort/` → logic and schemas for impact/effort matrix calculations.
   - `industry_cases/` → example use cases and reference datasets.
   - `metrics/` → formulas and calculators for redundancy index, ROI, and AI readiness.

4. **Files to Create:**
   - `src/domain/knowledge/index.ts` → exports all submodules.
   - `src/domain/knowledge/schema.ts` → defines TypeScript interfaces for knowledge objects.
   - `src/domain/knowledge/readme.md` → documents folder purpose and usage conventions.

5. **Testing:**
   - Run `npm run build` to verify module integrity.
   - No runtime changes should occur; this directive is structural.

---

### Safety & Fallback
- Do not alter or import UI components.
- Do not modify database or persistence layers.
- If naming conflicts occur, log to `/mesh_prompts/completed/knowledge_domain_error.log`.

---

### Success Criteria
- Folder and file structure successfully created.
- Build passes with `npm run build`.
- Project compiles with no new dependencies.
- Documentation (`readme.md`) clearly describes knowledge architecture and future population steps.

---

### Directive Metadata
- **Project:** fuxi_ea
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Codex 5.1 (VS Code)
- **Issued on:** 2025-11-25
- **Type:** Structural Directive
- **Priority:** Medium
- **Feature Branch:** `feat/d002a_knowledge_domain_setup`
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_ea_knowledge_domain_setup.md`
