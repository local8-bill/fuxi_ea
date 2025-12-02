## Directive D043A — Ecosystem Timeline Hooks

### Summary

Implements temporal context and timeline interaction logic in the Digital Enterprise (Ecosystem) workspace. This directive integrates the timeline slider with graph state management and harmonization data for accurate architectural state visualization.

---

### Goals

- Synchronize harmonization output with timeline events.
- Enable stage-based visualization (current, in-flight, future).
- Support auto-harmonization triggers upon new uploads.
- Ensure telemetry captures timeline interactions.

---

### Features

1. **Timeline Slider Integration**

   - Connects harmonized graph to timeline position.
   - Emits `timeline_stage_changed` telemetry with visible node/edge counts.
   - Prepares foundation for stage-based gating (current → in-flight → future).

2. **Project Flow Synchronization**

   - Intake → Tech Stack → Ecosystem sequence enforced via middleware.
   - Harmonization auto-runs on valid artifact upload.
   - Flow bar indicates step completion.

3. **Telemetry Coverage**

   - `upload_start`, `upload_complete`, `harmonization_*`, `timeline_stage_changed`, `graph_load` captured.
   - Stored locally at `.fuxi/data/telemetry_events.ndjson`.

4. **User Experience**

   - Timeline slider always visible.
   - No blank graph states; full harmonized data displayed.
   - Fit-to-space and cross-domain filters active.

---

###

## **✅ UAT Readiness Checklist (Post-D043A)**



\




### **1. Environment Prep**





- feat/d043a\_timeline\_hooks branch pulled and running cleanly
- .fuxi/data/ingested/ contains at least one *real* dataset (inventory or current-state CSV)
- npm run dev boots with no schema or runtime errors
- NEXT\_PUBLIC\_TELEMETRY\_DEBUG=true for event visibility





---





### **2. Upload + Harmonization Flow**





- Upload of single CSV → normalizes → harmonization completes → graph renders automatically
- Telemetry logs harmonization\_start and harmonization\_complete with non-zero nodes/edges
- File names appear correctly in UI (no placeholder “Lucid CSV” labels)
- Domain overlays match uploaded file (Commerce, ERP, etc.)
- “Other” domain toggle works and persists





---





### **3. Graph Integrity (Visual)**





- Fit-to-space auto-adjusts graph on load and zoom
- Derived (🟦), Inferred (🟪), Unresolved (🟧) edges display clearly
- Tooltip shows correct upstream/downstream counts
- Cross-domain toggle filters accurately
- No overlapping domain columns (min 50px spacing)





---





### **4. Timeline Interoperability**





- Timeline slider visible and functional
- Graph updates when slider moves (even if same data)
- No double renders or “blank graph” flashes
- Telemetry logs timeline\_stage\_changed with visible node/edge counts





---





### **5. Project Flow Integrity**





- New project → Intake → Tech Stack → Ecosystem (auto-sequence confirmed)
- Step gating works (can’t skip directly to DE without Intake)
- Verification dashboard reflects upload + harmonization status





---





### **6. Telemetry Validation**





- Verify .fuxi/data/telemetry\_events.ndjson includes events for:

  - upload\_start / upload\_complete
  - harmonization\_\*
  - timeline\_stage\_changed
  - graph\_load

- No duplicated or zero-value sessions





---





### **7. Performance & Stability**





- Graph renders ≤1.5 s with ≤200 nodes / ≤500 edges
- No console errors (especially dagre/cytoscape reflow or undefined edges)
- App recovers gracefully from malformed CSV (no white screen)





---





### **8. Exit Criteria**



\


✅ All checks pass → tag branch v0.6.4-uat-baseline

⛔ Any blocker → log to /docs/qa/issues-uat-d043a.md with repro steps



---



---

**Branch:** `feat/d043a_timeline_hooks`\
**Tag After UAT:** `v0.6.4-uat-baseline`

---

**Note to Codex:** Run the above UAT validation before tagging. Confirm telemetry, harmonization, and timeline stability. Once verified, tag and push branch to prepare for ROI Modeling (D044).

---

