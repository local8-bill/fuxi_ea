# Directive D100 — Sequencer → ALE Learning Contract

## 🎯 Purpose
Make the Sequencer *useful at a glance* **without requiring ROI/TCC** up front, while continuously feeding **ALE situational awareness** through deterministic signals, provenance, and user decisions.

This directive defines a minimal, boring, reliable **artifact + telemetry contract** so:
- Users can build sequences manually (natural language or structured UI)
- Sequencer can surface **risk + collisions + constraints** immediately
- ALE can learn recurring enterprise transformation patterns (without transcripts)
- Every derived insight is explainable and provenance-traceable

---

## ✅ Outcome
1. Sequencer saves a durable **Sequence Artifact** (user intent).
2. Sequencer emits **Telemetry Events** (what occurred + what user decided).
3. Sequencer computes **Stage Situational Awareness** (risk/constraints/blast radius) independent of ROI/TCC.
4. Collision detection becomes **structured intelligence** (not a one-off UI feature).
5. All derived signals include **confidence + provenance**.

---

## 1) Persisted Artifact: `SequenceDraft` (User Intent)
**Write on save/publish.**

### Required fields
- `sequenceId`, `name`, `version`, `createdAt`, `updatedAt`
- `stages[]` (ordered)
  - `stageId`
  - `title`
  - `start` (date or FY/Q) + `duration`
  - `systemsTouched[]` *(graph node ids)*
  - `integrationsTouched[]` *(graph edge ids; derived from node selection + topology)*
  - `regionScope[]` *(Canada, US, EMEA, etc.)*
  - `brandScope[]` *(optional)*
  - `channelScope[]` *(B2B, B2C, Retail, Marketplace)*
  - `intentTags[]` *(e.g., `decouple_ebs_b2c`, `mfcs_foundation`, `pilot_market`)*
  - `targets` *(optional)*: `{ goalType, targetDate, budgetCap }`
- `provenance[]` (global or per stage)
  - `{ sourceType: "manual"|"import"|"transcript"|"inferred", sourceRef, note }`

### Design rule
This is the **recipe card**. Keep it stable. Avoid fragile formulas. Prefer explicit IDs over text matching.

---

## 2) Append-only Telemetry: ALE Learning Events
**Emit on load, render, inference, collision detection, user resolution, save/publish.**

### Required events
1) `sequence_loaded`
- `sequenceId`, `version`, `source` (static|api|draft)
- `stageCount`, `nodeCountTouched`, `edgeCountTouched`

2) `stage_rendered` *(batch ok)*
- `sequenceId`, `stageId`
- `systemsTouched[]`, `integrationsTouched[]`

3) `collision_detected`
- `sequenceId`
- `collisionId`
- `type`: `shared_node` | `shared_edge` | `dependency_conflict` | `dual_run_overlap` | `blackout_window`
- `stageA`, `stageB`
- `entities[]` *(node/edge ids)*
- `severity` (1–5)
- `explain` (short)
- `confidence` (0–1)
- `provenance`: explicit|inferred

4) `user_resolution_applied`
- `resolutionType`: `split_stage` | `shift_dates` | `change_scope` | `accept_risk` | `add_guardrail`
- `delta`: before/after snapshot of impacted fields

5) `sequence_saved` and/or `sequence_published`
- `sequenceId`, `version`
- `confidenceSummary` (avg confidence, % inferred, missing fields)

### Telemetry rule
Events are the **training logs**. They must be stable, low-noise, and structured.

---

## 3) Computed Block: `stageAwareness` (No ROI/TCC required)
Computed per stage. Persist optionally; always emit in telemetry.

### Required fields
- `blastRadius`: `{ dependencyLoad, criticalityWeight }`
- `coupling`: `{ financial:boolean, inventory:boolean, fulfillment:boolean, dataContract:boolean }`
- `constraints`: `{ blackout:boolean, governanceGate:boolean, rfpDependency:boolean }`
- `storeFootprint`: `{ storesCount, countriesCount, brandsCount }` *(when `regionScope` exists; derived from Retail Store Location data)*
- `riskFlags[]` *(strings)*
- `confidence`: `{ overall, byField }`

### Why this exists
This is what makes the page useful at a glance:
- shows **what’s risky**
- shows **what overlaps**
- shows **what constrains timing**
- shows **what’s big (store footprint)**

---

## 4) Deterministic Learning Rules (Collision → Intelligence)
Implement as deterministic checks (no LLM dependency).

### Baseline checks
- Same time-window overlap + shared node ⇒ `shared_node`
- Same time-window overlap + shared edge ⇒ `shared_edge`
- Decommission/removal in Stage A while Stage B touches same system (same/adjacent window) ⇒ `dependency_conflict`
- Old+new run overlap on same capability/system ⇒ `dual_run_overlap`
- Stage start/duration intersects blackout calendar ⇒ `blackout_window`

### Severity bumps
- Any overlap where `coupling.financial=true` ⇒ severity +1
- Any overlap where `coupling.inventory=true` ⇒ severity +1
- High `storeFootprint.storesCount` ⇒ add `store_complexity` risk flag

### Learning capture
- Any `accept_risk` resolution must be logged (ALE learns tolerance patterns).

---

## 5) Retail Store Location Data: Where it applies
When a user selects a `regionScope` (or sequence stage is inferred to be region-scoped), enrich:
- `storeFootprint` in `stageAwareness`
- risk flags (e.g., `retail_ops_heavy`, `multi_brand_complexity`)
- optional constraints (e.g., if region has high store density, bias away from holiday windows)

This is the bridge from “scenario narrative” to **real operational reality**.

---

## 6) App Comb Pass: Where to add D100 instrumentation
Target high-leverage surfaces:

### Sequencer
- On sequence load, stage render, collision compute, resolution actions, save/publish

### Right-rail “Build a Sequence” dialogue
- When user inputs natural language intent
- When intent is parsed into stages/fields (emit `inference_applied` if present)

### Graph selection / overlay
- When nodes/edges are selected to define a stage
- When integrations are auto-derived from topology

### Scenario persistence layer
- Any API/store boundary where artifacts and events are persisted

---

## ✅ Acceptance Criteria
- A saved sequence has a complete `SequenceDraft` with stage-level `systemsTouched` + `integrationsTouched`.
- Every render produces computed `stageAwareness` per stage.
- Collision detection emits structured `collision_detected` events.
- User actions emit `user_resolution_applied` with deltas.
- Each derived insight includes `confidence` + `provenance`.
- Store location dataset enriches `stageAwareness` when `regionScope` is set.

---

## Notes
- ROI/TCC stays optional here. D100 is about **clarity and intelligence before finance**.
- Keep the contract stable. Make it boring. Boring ships.

