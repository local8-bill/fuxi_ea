## Directive 0007: Fuxi EA Core Visualization Roadmap (Canonical Copy)

**Branch in use:** `feat/d007_core_visualization_roadmap` (created 2025-11-26T01:09Z). Base dependencies: D005 (Living Map) and D006 (Predictive ROI/Simulation) already merged into working branch.

### Purpose
Define the unified visual, interaction, and architectural roadmap for Fuxi EA’s visualization layer — consolidating the progress from Directives D004 through D006 into a cohesive, scalable experience. The **Core Visualization Roadmap** aligns the Living Tech Stack Map, Predictive ROI Engine, and AI Intelligence layers into one living, evolvable interface.

---

### Objectives
1. Establish the **visual design system** (color, motion, hierarchy) that unifies all modules.
2. Define the **layer model** — what each layer represents, how they interact, and when to reveal them.
3. Map **user journeys** across roles (Architect, Analyst, Operator) and their visual priorities.
4. Design the **view hierarchy** that bridges operational visualization, analytics, and predictive forecasting.
5. Outline the **development roadmap** for Codex and the Mesh to incrementally build, test, and ship each visual milestone.

---

### Visual Language System
**Principles:** clarity, continuity, contrast.
- **Color:** Slate neutrals for structure, single accent color per layer type (Integration = blue, ROI = green, AI = violet, Risk = amber).
- **Motion:** Subtle; meaning-driven (fades for state transitions, pulses for activity, shimmer for health).
- **Typography:** Inter/Source Sans; hierarchy defined by semantic context (titles, metadata, code refs).
- **Depth & Layering:** Visual elevation denotes control vs. context — cards above charts, overlays above map.
- **Grid & Spacing:** 12-column responsive grid; no overlapping or absolute-locked UI.

---

### Layer Model (Five Foundational Views)
Each layer can be toggled independently or combined contextually.

| Layer | Description | Data Source | Primary Purpose |
|--------|--------------|--------------|------------------|
| 🗺️ **Stack** | Systems + Integrations (Base React Flow) | `/data/digital-enterprise/*` | Map the enterprise topology |
| 🏢 **Domain** | Business areas (Finance, Ops, Commerce, etc.) | `/data/domains.json` | Group and color-code systems |
| 🔌 **Integration** | Data & API flows between systems | `/data/integrations.json` | Show dependency and frequency |
| ⚙️ **Disposition** | Lifecycle state (Keep, Replace, Modernize, Retire) | `/data/disposition.json` | Visualize transformation trajectory |
| 🔥 **Heatmap/ROI/AI** | Dynamic overlays (cost, opportunity, readiness) | `.fuxi/data/insights/*` | Analyze and predict enterprise value |

---

### User Journeys

#### 1. Architect (Strategic Planner)
- Default to Domain + Integration view.
- Can toggle ROI and Disposition layers to visualize modernization path.
- Exports snapshot reports for leadership.

#### 2. Analyst (Operational Insight)
- Focus on Stack + ROI views.
- Simulates event timelines (decommissions, go-lives).
- Monitors cost/benefit progression and risk.

#### 3. Operator (Execution Layer)
- Focus on real-time Stack + Integration + Health views.
- Uses Event Log to monitor system behavior.
- Responds to predictive alerts and recommendations.

---

### View Hierarchy

1. **Map View** — React Flow canvas showing live enterprise topology.  
2. **Insights View** — contextual overlays and AI Opportunity visualizations.  
3. **Simulation View** — time-based transformations and impact logs.  
4. **Forecast View** — ROI curves, predictive outcomes, and business milestones.  
5. **Scenario Compare** — diff two saved states (Current vs Target).  

Each view is modular and composable; users can dock, undock, or overlay as needed.

---

### Development Roadmap (Codex & Mesh)

| Phase | Milestone | Description | Branch |
|--------|------------|-------------|---------|
| **Phase 1** | Stack Core | Finalize React Flow base + clustering | `feat/d005_living_tech_stack_map` |
| **Phase 2** | Simulation Layer | Add timeline, events, and playback | `feat/d006_predictive_impact_roi_engine` |
| **Phase 3** | Intelligence Overlay | Integrate AI Opportunity + ROI prediction | `feat/d007_ai_visual_intelligence` |
| **Phase 4** | Comparative & Reporting | Introduce scenario diff + export tools | `feat/d008_visual_reporting_suite` |
| **Phase 5** | UX Cohesion | Consolidate design tokens, animation, and consistency | `feat/d009_visual_unification_pass` |

---

### Safety & Consistency
- All layers toggle independently; failure in one does not break visualization core.
- Data bindings strictly read-only from `.fuxi/data` paths.
- UI performance target: maintain 60+ FPS with 200 nodes.
- Accessibility target: full keyboard navigation + ARIA compliance.

---

### Success Criteria
- Unified, performant, visually coherent interface across all visualization directives.
- Clear user experience for all roles with layer toggles and transitions.
- Predictive intelligence and ROI forecasting visible and actionable.
- Visual system modular enough for future agent-generated components.

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi (Architect)  
- **Issued on:** 2025-11-25  
- **Type:** Visualization Directive  
- **Priority:** Strategic  
- **Feature Branch:** `feat/d007_core_visualization_roadmap`  
- **Depends On:** D005 → D006  
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/docs/features/directives/directive_d007_core_visualization_roadmap.md`

---

### Verification & Milestone Tracking Table (status as of 2025-11-26T01:09Z)

| Phase | Milestone | Description | Status | Verified By | Timestamp |
|--------|------------|-------------|---------|--------------|------------|
| Phase 1 | Stack Core | React Flow foundation + clustering functional | ☑ | Codex | 2025-11-26T01:09Z |
| Phase 2 | Simulation Layer | Timeline + Event Log integrated, ROI sync verified | ☑ | Codex | 2025-11-26T01:09Z |
| Phase 3 | Intelligence Overlay | AI Opportunity and Predictive ROI layers operational | ☐ |  |  |
| Phase 4 | Comparative & Reporting | Scenario diff + export/report suite complete | ☐ |  |  |
| Phase 5 | UX Cohesion | Unified design system + visual consistency pass complete | ☐ |  |  |

---

**Note:** All future directives and handoffs will include a Verification & Milestone Tracking Table to ensure continuity and traceability across Mesh builds.
