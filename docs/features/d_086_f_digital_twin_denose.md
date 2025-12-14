## Directive D086F – Digital Twin Scene De-Noise & Structural Lock

### 🎯 Objective
Stabilize the **Digital Twin** scene by **temporarily unmounting all non-essential UI components** and restoring a **minimal, stable structure** before rebuilding dialogue and node interactions.

---

### 🧱 Keep (Core Layout Only)
- **Left Rail** → Focus / Domain list (collapsible)  
- **Center Canvas** → Graph visualization (systems + integrations only)  
- **Right Rail** → Option Menu with:  
  - “Build a Sequence”  
  - “Harmonize Stack”  
  - “Build Additional View”  

---

### 🧩 Temporarily Unmount (Hide)
*(Comment-out or conditional-render; do **not delete** the component or its import unless noted.)*

| Component | File / Path | Action |
|------------|-------------|--------|
| Simulation Controls | `src/components/graph/GraphSimulationControls.tsx` | Hide from scene render |
| Predictive Timeline / Sequencer | `GraphPredictivePanel.tsx`, `GraphSequencerPanel.tsx` | Hide |
| ROI / TCC Summary | `GraphFinancialSummary.tsx` | Hide |
| Transition Paths / Compare | `GraphTransitionCompare.tsx` | Hide |
| Decision Backlog Panel | `GraphDecisionBacklogPanel.tsx` | Hide |
| Debug / dx Monitor | `src/components/dev/` | Hide or disable route |
| Telemetry / ALE Insights | any view under `/logs/` | Hide |
| Legacy Focus or Insight Rails | any duplicate in `DigitalEnterpriseClient.tsx` | Hide if not part of left/right rails spec |

---

### 🧹 Structure to Retain
```
[ Left Rail ]  [   Graph Canvas   ]  [ Right Rail ]
   240px           auto (flex-1)        240px
```
- Rails remain collapsible.  
- Canvas expands dynamically when rails collapse.  
- Top nav stays fixed and minimal (mode + command line only).

---

### ✅ Completion Criteria
- Only graph + option menu visible in the scene.  
- No sequencer, simulation, or financial components mounted.  
- Graph alignment stable on resize.  
- Rails functional and responsive.  
- No console errors or ghost imports.  
- All hidden components can be re-enabled cleanly later.

---

**Branch:** `feature/086f_digital_twin_denose`  
**Approvers:** Bill, GPT-5 (review)  
**Dependencies:** D086A (layout baseline), D086B (template simplification)

