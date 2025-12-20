## 🧭 Directive D100 — Retail Footprint Scoping & Integration Load Calibration (Sequencer)

### 🎯 Objective
Convert **Retail Store Location** data into an enforceable **scope + cost driver** for scenario sequencing, so the Sequencer can (a) build realistic stages, (b) compute DL/TCC correctly, and (c) produce **provable provenance** even when no transcripts exist.

This directive formalizes **where and how store footprint is applied**: *after scenario intent is captured (transcript or manual), before we compute integration load, TCC, and ROI.*

---

### ✅ Core Principle
**Store footprint is not “extra context.”**  
It is a **scope oracle** that determines whether retail systems and their integration surface area exist **in the stage at all**.

---

### 📥 Inputs
- `store_location_updated.csv` (authoritative footprint)
  - required fields (minimum): `country`, `brand`, `location_id` (or equivalent unique), `is_company_owned` (if available)
- Graph / topology (already in ALE / harmonized graph)
  - nodes: `POS`, `StoreInventory`, `SIM`, `Halo`, `SalesAudit (RISA/SACS)`, `RetailAlloc`, etc.
  - edges tagged with `edge_type` (e.g., `pos_log`, `store_inventory_snapshot`, `store_returns`, `retail_sales_audit`)
- Scenario intent (from transcript synthesis *or* manual “Build a Sequence” NL input)
  - at minimum: `{ region/country, brand, channels_in_scope }`

---

### 🧠 Derived Fields
For any stage with `{country, brand}`:

1) **Footprint facts**
- `store_count = count(company-owned stores for country+brand)`
- `has_stores = store_count > 0`

2) **Scope toggles**
- `include_retail_surface = has_stores && channels_in_scope includes "Retail"`
- `exclude_retail_surface = !include_retail_surface`

3) **Integration load adjustment**
- `DL_scope = count(impacted_edges_after_scope_filter)`
- `integrationCount = DL_scope` (feeds TCCInputs)

4) **Footprint factor (optional)**
- `storeFootprintFactor = clamp(store_count / normalizationConstant, 0..1)`
- Used to scale: rollout duration, training/change cost, operational impact

---

### 🧮 Rules Engine
**Rule R1 — Retail systems are illegal if no stores exist**
- If `has_stores=false` → stage must not include:
  - store inventory tools (e.g., GStore), POS log flows, retail sales audit, store returns integrations, SIM/Halo, etc.

**Rule R2 — Retail surface is allowed only when explicitly in scope**
- Even if `has_stores=true`, retail systems appear only when scenario declares Retail in scope.

**Rule R3 — Footprint modifies integration effort**
- If retail surface included, add “retail integration pack” edges:
  - POS/RTLog, returns, sales audit, store inventory snapshots, store fulfillment visibility, etc.

---

### 🧾 Provenance Requirements
Every scope decision must emit a provenance record:

```json
{
  "type": "footprint_scope_decision",
  "stage_id": "stage_canada_teva_01",
  "inputs": {
    "country": "CA",
    "brand": "Teva",
    "channels_in_scope": ["B2B", "B2C"]
  },
  "store_query": {
    "source": "store_location_updated.csv",
    "filter": {"country": "CA", "brand": "Teva", "company_owned_only": true},
    "result": {"store_count": 0, "has_stores": false}
  },
  "effects": {
    "excluded_nodes": ["POS", "StoreInventory", "SalesAudit"],
    "excluded_edge_types": ["pos_log", "store_inventory_snapshot", "retail_sales_audit"],
    "integrationCount_before": 18,
    "integrationCount_after": 11
  }
}
```

---

### 🔌 Integration Points
- **Sequencer build pipeline**
  1) Parse scenario intent (manual NL or transcript synthesis)
  2) Apply **Footprint Scope Pass** (this directive)
  3) Build stage graph + compute DL_scope
  4) Compute TCC via `totalCostOfChange(TCCInputs)`
  5) Compute ROI / Payback curves
  6) Emit provenance + telemetry

- **Telemetry**
  - `footprint_scope_applied`
  - `integration_count_adjusted`
  - `tcc_computed`

---

### 📦 Output Artifacts
- `footprint_scope.json` per scenario (facts + toggles)
- `stage_integration_load.json` (before/after counts + edge diffs)
- Scenario JSON compatible with Sequencer (unchanged schema; only better inputs)

---

### ✅ Completion Criteria
1. Sequencer applies footprint scoping **before** integrationCount/TCC is computed.
2. Stages built for `{country, brand}` never include retail surface when `store_count=0`.
3. Provenance records show:
   - store query filter
   - store_count result
   - excluded nodes/edges
   - before/after integrationCount
4. Manual “Build a Sequence” flows can trigger the same logic without transcripts.

---

**Owners:** Agent Z (Bill), dx  
**Depends On:** Store Location dataset ingestion, graph edge typing  
**Feeds:** ROI/TCC, Readiness, Org Intelligence, Scenario Builder  
**Branch:** `feature/d100_retail-footprint-scoping`

