## Directive D045A — ROI Map Interaction Model

### Summary
Defines the user interaction and visualization model for the ROI-driven Ecosystem Map, using the "Airline Network" metaphor (domains as hubs, systems as terminals, integrations as routes). Establishes the two-level interaction pattern: Macro (Air Traffic Map) and Micro (Gate View).

---

### Objectives
- Present a clean, understandable macro view of the enterprise architecture network.
- Allow progressive exploration from domain-level (hubs) to system-level (terminals).
- Provide context for ROI overlays and timeline-based state transitions.

---

### 1. Macro View — **Air Traffic Map (Domain Hubs)**

**Purpose:** Show enterprise connectivity and cross-domain density.

**Behavior:**
- Each **Domain** (ERP, Commerce, Data, etc.) appears as a large compound node (hub).
- **Edges** represent integrations between domains. Edge labels show the count of routes (e.g., `ERP ↔ Commerce: 14`).
- Domains are colored by category (ERP = green, Data = blue, Commerce = orange, etc.).
- Hovering on a domain:
  - Highlights all connected domains and dims unrelated ones.
  - Displays tooltip metrics:
    - Total routes (edges)
    - % of total integrations
    - Avg. route complexity/cost.
- Clicking a domain opens its **Gate View** (expanded micro view).

**Telemetry:** `domain_hover`, `domain_expand`, `macro_edge_highlight`

**Overlay support:**
- ROI, Cost, Risk overlays apply color gradients to domains or edges.
- Timeline slider modifies visible routes by period (quarter/month/stage).

---

### 2. Micro View — **Gate View (System Terminals)**

**Purpose:** Enable system-level analysis and change impact evaluation.

**Behavior:**
- Expanding a domain reveals its internal **systems (terminals)**.
- Each system shows its direct integrations (routes) to other systems or domains.
- Controls:
  - `Show routes for this system only`
  - `Show all routes for this domain`
- Routes dynamically illuminate connected systems and domains.
- Tooltip or side panel shows details:
  - Integration type (API/Data/Workflow)
  - Direction (upstream/downstream)
  - Risk/Cost/ROI score.
- Cross-domain edges use dashed lines or muted colors to retain clarity.

**Telemetry:** `system_hover`, `route_expand`, `edge_detail_open`

**Overlay support:** ROI/COST/RISK colorize systems and routes based on attributes.

---

### 3. Timeline & ROI Integration

- Timeline slider reflects architecture evolution (Current → Transition → Future).
- Moving slider adjusts visible nodes and routes per stage.
- ROI overlays animate to reflect cost/benefit changes over time.
- Systems added/removed/modified during a stage are color-coded:
  - Added = green
  - Retired = red
  - Modified = yellow.

**Telemetry:** `timeline_stage_changed`, `overlay_mode_selected`

---

### 4. Technical Foundations

- Layout: Cytoscape COSE (primary), SBGN optional for presentation mode.
- Domain compounds as top-level nodes.
- Route edges carry weights for cost and volume.
- Fit-to-space auto-adjusts on load and expand.

---

### 5. Future Extensions

- "Route Optimization" mode: simulate removal/addition of a hub and visualize rerouting.
- "Bottleneck" heatmap: highlight overloaded systems.
- "ROI Simulation": dynamically compute ROI shifts as nodes/routes change.

---

### Implementation Order for D045A (Codex Summary)

1. Implement **Macro View** scaffold — domains as hubs, edges as integration counts.
2. Add **Gate View** expansion logic for systems within domains.
3. Wire **telemetry hooks** (`domain_expand`, `route_expand`, `timeline_stage_changed`).
4. Add placeholder ROI overlay toggles (color gradients only).
5. Keep COSE layout + Fit-to-space active; skip ROI math until D046.

---

**Branch:** `feat/d045_roi_map`
**Hand-off to Codex:** Implement macro/micro flow scaffolding with placeholder data bindings.
**Next Directive:** D046 — ROI Data Modeling & Forecast Engine.

