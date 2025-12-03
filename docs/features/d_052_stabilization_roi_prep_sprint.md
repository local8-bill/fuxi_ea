# D052: Stabilization & ROI Prep Sprint

Goal: Bring all active directives to a clean, merge-ready state by stabilizing the graph engine, completing transformation sequencing hooks, and scaffolding ROI data flows.

---

## 🎨 Graph Engine (React Flow / D037, D041, D047a)
- ✅ Confirm React Flow is the default graph engine (`NEXT_PUBLIC_GRAPH_ENGINE=reactflow`).
- 🔄 Validate D047a HAT checklist:
  - Fit-to-space works on load.
  - Domain nodes render with correct labels; edge hover active.
  - Performance <2s load for 50+ nodes.
  - Telemetry `graph_load` and `timeline_stage_changed` events fire.
- 🧹 Clean up unused Cytoscape imports and SBGN toggles (archive `CytoMap.tsx` and dependencies under `/archive/graph_engines`).
- 🎯 Output: tag `v0.6.6-reactflow-stable`.

---

## 🧠 Transformation Layer (D034, D040)
- 🔄 Verify `/project/:id/transformation-dialogue` renders correctly when `transformations.json` exists.
- ✅ Ensure stage telemetry fires (`stage_entered`, `system_transition`, `roi_stage_calculated`).
- 🧩 Merge any sequencer UAT hooks to harmonization results.
- 🚧 Prepare for ROI integration: ensure every transformation stage emits cost/benefit placeholders into telemetry (`roi_stage_calculated`).

---

## 💰 ROI Integration Prep (D045a, D051)
- 🧮 Stub `/api/roi/dashboard` endpoint → returns mock data matching new forecast format.
- 🧱 UI placeholder: add “ROI Dashboard” button to DE toolbar linking to `/project/:id/roi-dashboard`.
- 🧾 Add telemetry hook for `roi_dashboard_opened`.

---

## 🚢 Ship / Release (D038, D039)
- ✅ Run `npm run lint` and resolve errors in graph + transformation files only.
- 🏷 Tag after successful HAT: `v0.6.7-hat-complete`.

---

Notes:
- Keep scope tight to stabilization; defer new feature creep.
- Use React Flow as primary; archive Cytoscape/SBGN until needed.
