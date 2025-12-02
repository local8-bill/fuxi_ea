## Directive D041 — Digital Enterprise Graph Overhaul (Cytoscape Integration)

### Purpose
Transition the **Digital Enterprise (DE) Graph View** from **React Flow** to **Cytoscape.js** to improve scalability, readability, and analytical depth. This overhaul will ensure the visualization can handle complex enterprise ecosystems (1k+ nodes, 2k+ edges) with domain clarity, visual performance, and AI-readiness.

---

### Objectives
- Replace React Flow with Cytoscape.js for graph rendering.
- Preserve existing harmonization data model (nodes, edges, confidence, domains).
- Introduce dynamic, domain-aware layouts that highlight business context.
- Prepare groundwork for future AI insights (dependency strength, critical path, risk zones).

---

### Implementation Phases

#### Phase 1 — Core Setup
- Integrate `cytoscape`, `cytoscape-dagre`, `cytoscape-cose-bilkent`, and `cytoscape-edgehandles`.
- Create a new component `CytoGraph.tsx` for initialization, rendering, and layout management.
- Load data via `/api/digital-enterprise/view` and apply COSE-Bilkent layout.
- Test with Deckers dataset (50–500 nodes) for initial performance metrics.

#### Phase 2 — Styling & Domain Grouping
- Map harmonization states to node colors and edge confidence to stroke styles.
- Use compound nodes for domain grouping (ERP, Commerce, Data, etc.).
- Introduce domain color mapping in `src/config/domainColors.json`.
- Add a domain toggle overlay to filter visible domains.

#### Phase 3 — Interactions & Focus Tools
- Implement hover highlighting and focus-lock behavior.
- Add `useCyFocus()` hook for hover/shift-click interactions.
- Add a node detail side panel (`CytoDetailDrawer.tsx`) with domain, confidence, and disposition data.
- Support Shift+Click for cluster lock, Ctrl+Click for impact preview.

#### Phase 4 — Performance Optimization
- Apply edge bundling and node visibility throttling.
- Add layout debounce for pan/zoom.
- Add graph metrics (node count, edge count, density).
- Enable PNG/SVG export of the current graph.

#### Phase 5 — Verification & Cutover
- Replace `LivingMap.tsx` and migrate overlay logic.
- Ensure backward telemetry compatibility.
- Tag release after successful QA validation.

---

### Mock Dataset for Graph Validation

**File:** `.fuxi/data/mock/harmonized_enterprise_graph.json`

```json
{
  "nodes": [
    { "data": { "id": "commerce", "label": "Commerce Engine", "domain": "Commerce", "state": "added", "confidence": 0.9 } },
    { "data": { "id": "oms", "label": "Order Mgmt System", "domain": "Order Management", "state": "modified", "confidence": 0.8 } },
    { "data": { "id": "pim", "label": "Product Information Mgmt", "domain": "Product", "state": "unchanged", "confidence": 1.0 } },
    { "data": { "id": "rms", "label": "Retail Merch System", "domain": "Retail", "state": "removed", "confidence": 0.7 } },
    { "data": { "id": "erp", "label": "Oracle ERP", "domain": "ERP", "state": "unchanged", "confidence": 0.95 } },
    { "data": { "id": "mdm", "label": "Master Data Mgmt", "domain": "Data", "state": "added", "confidence": 0.85 } }
  ],
  "edges": [
    { "data": { "source": "commerce", "target": "oms", "type": "derived" } },
    { "data": { "source": "oms", "target": "pim", "type": "inferred" } },
    { "data": { "source": "pim", "target": "rms", "type": "unresolved" } },
    { "data": { "source": "erp", "target": "mdm", "type": "derived" } },
    { "data": { "source": "mdm", "target": "commerce", "type": "inferred" } }
  ]
}
```

**Expected Results:**
- Six nodes rendered, distinct color per state.
- Five edges styled correctly (solid, dashed, dotted).
- Compound nodes visible for each domain.
- Graph loads in <300ms with COSE-Bilkent layout.

---

### Verification Checklist
| Checkpoint | Description | Owner |
|-------------|--------------|--------|
| Layout toggle | Dagre/COSE/Concentric layouts work | Codex |
| Domain grouping | Compound nodes reflect CSV domains | Fuxi |
| Edge palette | Derived/inferred/unresolved distinct | Fuxi |
| Focus | Hover/Shift-click isolates connections | Codex |
| Export | PNG/SVG export functional | Mesh QA |
| Performance | 1k nodes render under 1.5s | Mesh QA |

---

### Branch
`feat/d041_cytoscape_overhaul`

### Tag After Completion
```bash
git tag -a v0.7.0-cytoscape-overhaul -m "Replaced ReactFlow DE Graph with Cytoscape.js (D041)"
git push origin v0.7.0-cytoscape-overhaul
```
