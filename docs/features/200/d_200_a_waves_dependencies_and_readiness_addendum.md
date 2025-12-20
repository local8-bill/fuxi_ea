# D200A — Waves, Dependencies, and Readiness Addendum

## Why this exists
D200 covers the workflow and contracts, but the UX problem you called out (waves starting in the same year and “not telling an accurate story”) needs **explicit artifacts + rules** so engineering can implement it without interpretation.

---

## 1) Wave stacking must explain *why* overlap is okay (or not)
Overlapping waves are not inherently bad.
**Overlap becomes risky when the overlap touches the same thing** (system / integration / team capacity) or violates a dependency.

### New artifact: `WaveDependencyGraph`
**Produced:** Stage 2+ (Refinement), re-evaluated at Stage 3 (Conflicts)

**Minimum contract**
- `sequenceId`
- `nodes[]` (waveId or stageId)
- `edges[]`
  - `from`, `to`
  - `type` (`hard_dependency` | `soft_dependency` | `shared_change_pressure` | `shared_team_capacity`)
  - `objectRefs[]` (systemId/integrationId)
  - `rationale` (1–2 lines)
  - `confidence` (0–1)

### Stacking rules
- **Hard dependency:** B cannot start until A completes.
- **Shared-change pressure:** A and B overlap while changing the same `systemId` or `integrationId` → show connector.
- **Shared team capacity:** A and B overlap and demand the same resource pool beyond capacity → show connector.

### Required UX overlay (Sequencer)
- Overlap markers: “Intentional parallel” vs “Unplanned collision.”
- Dependency connectors: thin line = soft, thick line = hard.
- Tooltip on connector: objectRefs + rule fired + why.

### New conflict type
Add conflict type: `shared_team_capacity`.

---

## 2) Conflict qualification must be auditable
If someone asks “who decided that’s a conflict?” the app must answer.

### New field on conflicts
- `qualificationEvidence[]`
  - `kind` (`system` | `integration` | `dependency` | `resource_pool`)
  - `refId` (systemId/integrationId/etc.)
  - `overlapWindow`
  - `ruleFired`

---

## 3) Readiness must be first-class (without bloating Sequencer)
You called this out as the “missing question”: *Is the organization ready for this?*

### New artifact: `ReadinessGateSet`
**Produced:** Stage 5 Role Review (optionally previewed in Stage 2)

**Minimum contract**
- `sequenceId`
- `gates[]`
  - `gateId`, `stageId`
  - `dimension` (org | data | process | vendor | infra)
  - `status` (GREEN | YELLOW | RED)
  - `evidence[]` (links/notes)
  - `ownerRole`

**Behavior:** RED gates can flip a review outcome to `BLOCKED`.

---

## 4) People plan + Capex/Opex framing (CFO ammo)
Sequencer shouldn’t be a finance dashboard, but CFO questions require the underlying contracts.

### New artifact: `ResourcePlan`
**Produced:** Stage 6 Financialization

**Minimum contract**
- `sequenceId`
- `roles[]` (Integration Eng, Data Eng, QA, PM, etc.)
- `headcountByMonth[]`
- `opexEstimateByMonth[]`
- `capexEstimateByMonth[]`
- `depreciationAssumptions` (optional: straight-line months)

---

## 5) What I think D200 was still missing (now explicitly covered)
- A wave/stage dependency graph (so overlap is readable, not confusing).
- A team-capacity conflict type (shared systems aren’t the only collision).
- Auditable conflict evidence (so you can defend it).
- Explicit readiness gates (org/process/data/vendor/infra).
- A lightweight resource plan contract (so ROI/TCC can answer headcount + capex/opex + depreciation questions later).

