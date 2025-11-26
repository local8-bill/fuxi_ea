## Directive 0005: Fuxi EA Living Tech Stack Map Engine

### Purpose
Transform the static Digital Enterprise visualization into a **dynamic, interactive simulation environment** — the Living Tech Stack Map. Using **React Flow (open-source)** as its foundation, this engine will model systems as intelligent, data-driven entities capable of expressing relationships, health, AI readiness, and cost dynamics in real time.

**Status:** ✅ Completed

---

### Objectives
1. Extend the current React Flow visualization (Directive 0004) to support system intelligence, interactivity, and simulation.
2. Enable architects and analysts to explore **impact propagation, dependency strength, redundancy, and modernization opportunities**.
3. Lay the groundwork for predictive and AI-assisted architecture modeling.

---

### Concept Overview
The Living Tech Stack Map visualizes the enterprise as a **living, adaptive network** where each node and connection represents an operational reality:
- **Nodes = Systems or Capabilities** (with dynamic metrics: cost, performance, readiness, redundancy)
- **Edges = Integrations or Dependencies** (with attributes: frequency, data volume, criticality)
- **Overlays = Insights** (AI-driven visual layers: redundancy heatmap, AI opportunity zones, cost vs value projections)

---

### Interactive Behaviors
1. **Node Intelligence**
   - Display system metadata on hover (Owner, Domain, Cost, Health, AI Readiness).
   - Animate based on live metrics (e.g., pulse = integration load).
   - Node color scale = health → performance degradation → risk.

2. **Edge Semantics**
   - Edge thickness = dependency frequency or data volume.
   - Edge color = dependency type (API, Data, Workflow, Manual).
   - Click edge to reveal latency, throughput, and redundancy data.

3. **Simulation Mode**
   - Toggle “Impact Simulation” mode.
   - When a node is disabled (simulated outage), edges fade dynamically.
   - Graph rebalances with recalculated downstream risk.
   - AI assistant suggests alternative system routes or replacements.

4. **Analyst Tools**
   - Snapshot comparison between states (current vs optimized).
   - Export network health summary to PDF/CSV.
   - Search bar for nodes, domains, or integration paths.

---

### Implementation Plan (for Codex)
1. **Branch:** `feat/d005_living_tech_stack_map`
2. **Base:** Build upon `feat/d004_reactflow_impact_engine`.
3. **New Components:**
   - `src/components/LivingMap.tsx` → orchestrates React Flow + simulation logic.
   - `src/components/NodeDetailPanel.tsx` → contextual detail + metric view.
   - `src/hooks/useSimulationEngine.ts` → compute impact and propagation.
4. **Data Model:**
   - Extend `.fuxi/data/digital-enterprise` schema with new attributes:
     - `ai_readiness`, `redundancy_score`, `integration_intensity`, `cost_performance_ratio`.
   - Store snapshots in `.fuxi/data/snapshots/`.
5. **Visual Enhancements:**
   - Add node animations for live metrics.
   - Layer toggles (e.g., Cost, AI Readiness, Risk).
   - Use `Recharts` overlays for micro visual summaries.
6. **Controls:**
   - Toolbar for toggling modes: Inspect | Simulate | Optimize.
   - Sidebar (Node Detail) dynamically updates with click.
7. **Testing:**
   - Ensure render performance with 100+ nodes.
   - Validate AI readiness overlay alignment with D003’s Opportunity Index.

---

### Safety & Fallback
- Use only open-source React Flow APIs.
- Disable simulation mode gracefully on performance limits.
- Fallback message: *“Simulation unavailable — insufficient data.”*
- Log simulation metrics to `/mesh_prompts/completed/living_map_log.json`.

---

### Success Criteria
- Dynamic React Flow graph with system intelligence.
- Interactive impact simulation mode operational.
- Visual overlays for cost, redundancy, and AI readiness.
- Real-time updates from underlying data.
- All visuals performant and dependency-free.

---

### Directive Metadata
- **Project:** fuxi_ea
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Codex 5.1 (VS Code)
- **Issued on:** 2025-11-25
- **Type:** Simulation Directive
- **Priority:** Critical
- **Feature Branch:** `feat/d005_living_tech_stack_map`
- **Auth Mode:** Disabled (FUXI_AUTH_OPTIONAL=true)
- **Depends On:** D004 – React Flow Impact Engine
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_ea_living_tech_stack_map.md`
