## Directive 0004: Fuxi EA System Dependency & Impact Visualization Engine

### Purpose
Implement an interactive visualization engine using **React Flow (open-source)** to model, explore, and analyze upstream/downstream system dependencies within the Fuxi EA Digital Enterprise view. This feature enhances impact analysis by visualizing system relationships, integration density, and dependency paths.

**Status:** ✅ Completed

---

### Objectives
1. Integrate **React Flow (open-source)** to visualize system dependencies and data flows.
2. Enable impact analysis through node and edge interactions.
3. Provide a foundation for AI-driven insights (e.g., risk propagation, redundancy mapping).
4. Maintain lightweight, performant rendering for large enterprise models.

---

### Scope & Architecture
- **Scope:** Integrate visualization directly into the Digital Enterprise page (`src/app/digital-enterprise/page.tsx`).
- **Library:** Use **reactflow** (open-source version only).
- **Data Source:** System and integration data from `.fuxi/data/digital-enterprise/` JSON store.
- **Future Extensibility:** Modular design to support custom layouts, AI-driven graph styling, or performance metrics.

---

### Implementation Plan (for Codex)
1. **Branch:** `feat/d004_reactflow_impact_engine`
2. **Dependencies:**
   ```bash
   npm install reactflow
   ```
3. **Files to Create:**
   - `src/components/ImpactGraph.tsx` → React Flow implementation with node/edge rendering.
   - `src/hooks/useImpactGraph.ts` → Fetch, normalize, and structure graph data.
   - `src/types/impactGraph.ts` → Type definitions (SystemNode, IntegrationEdge, MetricData).
4. **Integration:**
   - Embed `ImpactGraph` into `DigitalEnterpriseView`.
   - Fetch system/integration JSON data and convert to nodes and edges.
5. **Features:**
   - Pan, zoom, and drag nodes.
   - Tooltip or side panel showing system details (dependencies, impact score, AI readiness).
   - Color-coding by domain or impact severity.
   - Dynamic edge weights based on integration intensity.
6. **Persistence:**
   - Cache computed layouts in `.fuxi/data/graph/layout_cache.json`.
7. **Testing:**
   - Verify render performance with 50+ nodes.
   - Ensure no Pro-only APIs are used.
   - Run `npm run build` for validation.

---

### Safety & Fallback
- Use only **open-source React Flow**.
- No dependencies on React Flow Pro or external services.
- If data parsing fails, display fallback message: *“No dependency data available.”*
- Log render errors to `/mesh_prompts/completed/reactflow_impact_engine_log.json`.

---

### Success Criteria
- Digital Enterprise view displays interactive dependency graph.
- Nodes and edges represent accurate upstream/downstream relationships.
- Impact analysis panels show dependency details.
- No paid React Flow features used.
- Build and lint pass successfully.

---

### Directive Metadata
- **Project:** fuxi_ea
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Codex 5.1 (VS Code)
- **Issued on:** 2025-11-25
- **Type:** Visualization Directive
- **Priority:** High
- **Feature Branch:** `feat/d004_reactflow_impact_engine`
- **Auth Mode:** Disabled (FUXI_AUTH_OPTIONAL=true)
- **Dependencies:** Open-source React Flow only (no Pro features)
- **Depends On:** Directive 0003 – Insight & AI Opportunity Engine
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_ea_reactflow_impact_engine.md`
