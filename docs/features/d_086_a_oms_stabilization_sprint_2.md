## Directive D086A – OMS Stabilization and Behavioral Stub (Sprint 2)

### 🧭 Objective
Establish a clean and verified OMS dataset, restore sequencing integrity across FY26–FY28, and introduce a behavioral data stub for the Org Readiness Engine (D085G). This sprint ensures that the OMS transformation scenario, Sequencer, and Org Intelligence layers have a consistent and reliable data foundation.

---

### 🧩 Scope
1. **OMS Graph Stabilization (Core Objective)**
   - Lock live → static snapshot workflow (`graph_live.json` → `oms_transformation.json`).
   - Validate system domain mapping (Commerce, OMS, Finance).
   - Confirm that sequencing aligns to FY26–FY28 phases.
   - Remove duplicate and orphaned system entries.
   - Tag secondary systems as `indirect` or `supporting` for contextual rendering.
   - Run validation script (`npm run verify:oms-integrity`).

   ✅ **Deliverable:** Verified OMS dataset, harmonized with the live API, under `feature/oms-stabilization`.

---

2. **UI Readability Prep (No Logic Change)**
   - Add layout constants for left/right lanes and hero canvas (collapsible toggles disabled by default).
   - Create `LayoutState.ts` scaffold to define layout variants.
   - Store `graph.css` baseline for upcoming D086B (visual simplification phase).

   ✅ **Deliverable:** Readability-safe baseline for Graph Prototype; zero logic modification.

---

3. **Behavioral Signal Stub (Org Readiness Engine Feed)**
   - Create minimal endpoint: `/api/behavioral/`.
   - Accept, validate, and log normalized conversation payloads (schema: timestamp, speaker, sentiment, topic).
   - Provide `/behavioral/events` output for Org Readiness Engine (D085G) to ingest.
   - Add sample test payloads and documentation in `docs/api/behavioral_stub.md`.

   ✅ **Deliverable:** Behavioral API stub with mock event ingestion + unit tests.

---

4. **Documentation and Command Beans Update**
   - Update `docs/features/d_085_g_org_readiness_engine.md` with integration map and dependency reference.
   - Add new command beans:
     ```bash
     npm run ingest:oms-snapshot      # Convert live API feed to static dataset
     npm run verify:oms-integrity     # Validate node and link consistency
     npm run dev:readiness-stub       # Launch behavioral stub for local testing
     ```
   - Ensure consistency with existing beans structure.

   ✅ **Deliverable:** Updated dev toolkit and documented usage.

---

### ✅ Completion Criteria
| Area | Checkpoint | Owner |
|------|-------------|--------|
| OMS Data | Static snapshot verified and loaded correctly | dx |
| Sequencer | Phases match FY26–FY28 mapping | dx |
| Layout | Baseline constants applied (no style regression) | dx |
| Behavioral Stub | Endpoint tested and responding | dx |
| Docs/Beans | Updated and validated | Agent Z |

---

### 📁 Branching & Workflow
```
feature/oms-stabilization
feature/behavioral-stub
docs/sprint2_dx
```

Merge both feature branches into `dev` after validation.

---

### ⏳ Sprint Duration
**Start:** Immediately upon approval  
**End:** +7 days (target: Dec 18, 2025)  
**Review Meeting:** Dec 19, 2025 — focus on readiness for D086B (UX Simplification)

---

**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D084C (OMS Graph), D085G (Readiness Engine), D085A (Sequencer)

