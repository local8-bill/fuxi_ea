# D200 — Scenario → Sequencer → Role Review → ROI/TCC Workflow

## Purpose

Define the **end-to-end workflow** that turns a manually-created Scenario into an executable Sequence, validates it through role-based review, and then produces financial outputs (ROI/TCC) — with **explicit data contracts per stage** so implementation stays honest.

This is the “how we do it in the real world” path: **Scenario (hypothesis) → Sequencer (plan) → Role Review (stress test) → ROI/TCC (financial story) → Feedback (learn + iterate).**

---

## Core principle

Sequencer exists to answer one question:

**“What is the most achievable path to reach the target (e.g., OMS global by 2030) under the declared constraints?”**

If not feasible, the system must say so plainly.

---

## Workflow stages

### Stage 0 — Scenario Intake

**User intent:** “Build a scenario…” in natural language.

**Output artifact:** `ScenarioDraft`

**Minimum contract (ScenarioDraft)**

- `scenarioId`
- `name`
- `targetOutcome` (e.g., “OMS global by 2030”)
- `scope`
  - `regions[]`
  - `brands[]`
  - `channels[]` (B2B, B2C, Retail, etc.)
  - `includeRetailLocations: boolean`
- `constraints`
  - `blackoutWindows[]` (default: Nov 1 → Jan 15)
  - `deadlineYear?`
  - `budgetCapex?`, `budgetOpex?` (optional targets)
- `assumptions[]` (strings)
- `createdBy`, `createdAt`

**Where store location data applies** Store locations are used here to materialize scope into measurable units:

- `storeCount`, `countryCount`, `brandPresenceByRegion`
- candidate “pilot regions” based on manageable size

---

### Stage 1 — Coarse Sequence Compilation

**System intent:** create an initial (messy) draft plan from the target and known architecture graph.

**Output artifact:** `SequenceDraft.v1`

**Minimum contract (SequenceDraft.v1)**

- `sequenceId`, `scenarioId`
- `waves[]` (coarse)
  - `waveId`, `name`, `start`, `end`
  - `goal`
  - `stages[]` (coarse)
- `provenance[]` (what evidence/assumptions produced this stage)
- `status = "DRAFT"`

**Provenance requirement** Each stage must include at least one:

- `source = transcript | user_input | graph_edge | heuristic | imported_asset`
- `note` (human readable)

---

### Stage 2 — Refinement Loop

**User + agent intent:** refine the plan until it’s “coherent enough to review.”

**Output artifact:** `SequenceDraft.v2+` + `RefinementLog`

**Refinement prompts (auto vs manual)**

**Auto-surfaced by EAgent/Mistral** (system should propose these):

- “You included retail stores — do we have a store list and brand mapping?”
- “Pick an initial region: smallest viable / lowest integration load / shared process similarity.”
- “Any known hard constraints? blackout windows, vendor selection gates, data readiness.”
- “Do we need parallel lanes? If yes, which systems/integrations are shared?”

**Manual checklist items** (user can run later, not always forced):

- “Confirm ownership: who approves region/channel sequencing?”
- “Identify which integrations are most fragile / change-sensitive.”
- “Capture ‘must-not-break’ capabilities.”

**Minimum contract additions (SequenceDraft.v2+)** Per stage:

- `systemsTouched[]`
- `integrationsTouched[]`
- `changeType` (build/replace/decouple/migrate/retire)
- `region?`, `brand?`, `channel?`
- `dependencies[]` (stageIds)
- `cutoverType?` (go-live / migration / config / non-prod)

---

### Stage 3 — Conflict Detection & Calibration

**System intent:** detect overlaps that matter; explain why; let users calibrate.

**Output artifacts:** `ConflictSet` + `CalibrationEvents` + updated `RiskPosture`

**Minimum contract (ConflictSet)**

- `conflictId`
- `type` (shared\_system | shared\_integration | dependency\_overlap | dual\_run\_split\_brain | blackout\_violation)
- `objectRef` (systemId or integrationId)
- `stagesInvolved[]` (stageIds)
- `overlapWindow` (start/end)
- `ruleFired` (string)
- `severity` (0–100)
- `explanation` (1–2 lines)

**Minimum contract (CalibrationEvent)**

- `calibrationId`, `conflictId`, `sequenceId`
- `userAction` (lower | confirm | raise | dismiss)
- `reasonTags[]` (optional)
- `deltaSeverity`
- `createdBy`, `createdAt`

**Where calibration is stored** Persist calibration at **project/sequence scope**, not “about a person.”

- `risk_posture(projectId)` updated from aggregate calibration behavior
- calibration events stored for provenance + model tuning

**Feedback loop (ASCII)**

```
Conflict detected → User reviews → Calibration event saved
        ↓                         ↓
  Severity updated           Risk Posture updated (project-level)
        ↓                         ↓
  Sequencer reranks        Future conflicts scored more accurately
```

---

### Stage 4 — Decision Capture & Save

**User intent:** “This sequence is decent. Save it.”

**Output artifacts:** `SequenceSnapshot` + `DecisionLog`

**Minimum contract (DecisionLog entry)**

- `decisionId`
- `sequenceId`
- `title`
- `decisionType` (sequencing | architecture\_option | vendor\_gate | risk\_acceptance)
- `options[]` + `selectedOption`
- `rationale`
- `linkedConflicts[]`
- `owner` (role/team) + `timestamp`

---

### Stage 5 — Role Review

**System intent:** let different roles “murder-room” the plan with their filters.

**Output artifact:** `RoleReviewPacket` + `ReviewOutcome`

**RoleReviewPacket (minimum)**

- `sequenceId`
- `role` (Architect | Finance/CFO | Ops | Security | Data | Program)
- `reviewChecklist[]` (role-specific)
- `findings[]`
  - `findingId`, `type` (risk | gap | dependency | cost\_driver | readiness)
  - `severity`, `evidence`, `recommendedChange`

**Review outcome states**

- `APPROVED`
- `APPROVED_WITH_RISKS` (risks accepted + tracked)
- `NEEDS_REVISION` (must modify sequence)
- `BLOCKED` (cannot proceed until resolved)
- `SPLIT_DECISION` (roles disagree)

**If roles disagree (SPLIT\_DECISION)** System must do one (MVP pick):

1. **Fork the sequence** into variants (A/B) and track divergence, **or**
2. Require a designated **Program Owner** to resolve and record a decision.

(Do not silently average opinions.)

---

### Stage 6 — ROI/TCC Financialization

**Intent:** answer CFO-style questions using the Financials scene, not Sequencer clutter.

**Output artifacts:** `FinancialModelInputs` → `FinancialForecast`

**Minimum contract (FinancialModelInputs)**

- `sequenceId`
- per stage/system:
  - `baseStageCost`
  - `integrationCount` / `integrationCost`
  - `dualRunPenalty`
  - `resourceHeadcount`, `hourlyRate`, `durationHours`
  - `operationalImpactPercent`, `domainRevenue`
  - `riskFactor`, `governancePercent`
- targets:
  - `budgetCapex?`, `budgetOpex?`
  - `deadlineYear?`

**Minimum contract (FinancialForecast)**

- `tcc_total`, `tcc_ratio`
- `costCurve[]`, `benefitCurve[]`, `roiCurve[]`
- `breakEvenMonth?`
- `capexSchedule[]`, `opexSchedule[]` (if user provides)
- `systemsRetired[]` with retirement dates
- `capabilityGains[]` (new business capabilities by stage)

---

### Stage 7 — Feedback to Sequencer

Financial findings should feed back as **constraints and highlights**, not spam.

**Feedback artifacts**

- `FeasibilityReport`
  - hard blockers (budget/deadline)
  - top cost drivers (usually integrations + dual-run + resourcing)
  - recommended resequencing moves

---

## UI placement rules

- **Left nav** = navigation between scenes.
- **Left rail (Sequencer)** = *toolkit* (filters, toggles, actions).
- **Right rail (Sequencer)** = *navigator/inspector* (conflict drawer, stage details, scenario intent).

(Keep aligned with D100/D100A; don’t drift.)

---

## Telemetry (learning hooks)

- `scenario_created`
- `sequence_compiled`
- `sequence_refined`
- `conflict_detected`
- `conflict_reviewed`
- `risk_posture_updated`
- `sequence_saved`
- `role_review_completed`
- `financials_forecast_generated`
- `target_infeasible`

---

## Acceptance criteria

- Engineers can point to a **specific artifact contract** for every stage.
- Conflict calibration clearly states **where it is persisted** and **how it feeds back**.
- Role reviews have explicit outcome states and a defined resolution path for disagreement.
- Sequencer stays about **planning and clarity**; ROI/TCC stays about **financial storytelling**.

