# D100 — Sequencer At-a-Glance Usability, Conflicts, and Scenario Cards

## Purpose

Make the **Sequencer page useful at a glance** by:

1. clarifying **what the plan is** (timeline),
2. surfacing **what’s risky / conflicting** (conflicts + inspector), and
3. ensuring **Scenarios are not “stage cards again”** (they become hypothesis/learning cards).

This directive is about **sequencing clarity first**. ROI/TCC can be *entered as targets* and refined later (ROI/TCC has its own scene).

---

## Outcomes

### O1 — The Sequencer answers one top question

**“What is the best *********achievable********* path to roll out OMS globally by 2028?”**

- If the target is not feasible, Sequencer must say so plainly.
- Sequencer should not “make the math work” if the plan is impossible.

### O2 — Parallel waves become understandable

Parallel waves are allowed, but the UI must reveal:

- what is happening in parallel,
- which systems/integrations overlap,
- where the true dependency/collision risk is.

### O3 — Conflicts become explainable and interactive

Users must be able to see:

- **what exactly conflicts**,
- **why it qualifies as a conflict**,
- and optionally **agree/disagree** to tune severity (feeds learning).

---

## Page Sections and Requirements

### 1) Timeline (Waves)

**Job:** show the transformation plan.

**Key rule:** Waves can overlap in time, but the UI must display **overlap intent** and **shared-change pressure**.

#### Required wave fields

- `waveId`, `name`
- `start`, `end` (or `start`, `duration`)
- `goal` (1-line)
- `stages[]`

#### Required stage fields (minimum)

- `stageId`, `name`
- `start`, `end`
- `scenarioId` (what hypothesis it serves)
- `systemsTouched[]` (system IDs)
- `integrationsTouched[]` (integration IDs)
- `changeType` (e.g., build/replace/decouple/migrate/retire)
- `region` + `brand` (when relevant)

#### ASCII: overlapping waves + shared-change pressure

```
Year:    2026            2027            2028

Wave 1:  [==== Stage A ====][=== Stage B ===]
Wave 2:        [==== Stage C ====][== Stage D ==]
Wave 3:                     [===== Stage E =====]

Shared-change pressure (example):
  EBS ───────────────┐
  DOMS ───────┐      │  (Touched in overlapping windows)
  MFCS ───────┴──────┘

=> Overlap itself isn’t “bad” — overlap on the *same component/integration* is the risk.
```

---

### 2) Conflicts Summary

**Job:** show a compact count + severity rollup that makes you look where it hurts.

#### Conflict definition (baseline)

A **conflict** occurs when two (or more) stages overlap in time **and** share one of:

- the same **system** being changed,
- the same **integration** being changed,
- a direct **dependency chain** where upstream change overlaps downstream adoption,
- a dual-run window creating **split-brain ownership risk**.

#### Conflict must include “why”

Every conflict must be explainable with:

- **overlap window** (dates)
- **shared object** (system/integration)
- **qualification rule** that fired (e.g., `sharedIntegrationDuringOverlap`)

---

### 3) Conflict Inspector (Right Rail)

**Job:** show conflict details without obscuring the rest of the page.

#### UX pattern

Use **shadcn Drawer** (right side).

- Small form by default.
- Expands for deep detail.
- Never blocks the full timeline.

#### Drawer content (minimum)

- Title: `Conflict: {system|integration} overlap`
- “What’s colliding” list:
  - Stage A (wave, dates)
  - Stage B (wave, dates)
- “Why it’s a conflict”:
  - rule fired + short explanation
- Impact hints (not ROI/TCC spam):
  - *Operational risk*, *integration churn*, *dual-run*, *cutover risk*

#### User calibration (learning)

Add an explicit control:

- **Agree / Disagree** (or severity adjust: Lower / Confirm / Raise)
- Optional: reason chips (e.g., “teams independent”, “same team”, “known dependency”, “false positive”)

This feeds **Risk Posture** learning (see D100A) and improves conflict heuristics.

---

### 4) Scenarios List (Left Column Cards)

**Job:** scenarios answer **“what are we trying to prove / learn?”**

These are not stage summaries.

#### Scenario card must show (at-a-glance)

- **Scope:** e.g., `CA · Teva · 34 stores` (or `CA · Teva · DTC only`)
- **Goal:** e.g., `Decouple EBS from B2C order flow`
- **Primary risk:** e.g., `Split-brain order ownership / ATP contract`
- **Owner / Decision needed:** e.g., `MFCS-first vs Direct integration`

#### Scenario object (minimum schema)

- `scenarioId`, `name`
- `scope`: `{ region, brand, channels, storeCount? }`
- `goal` (string)
- `primaryRisk` (string)
- `decisionNeeded` (string)
- `stages[]` (refs)

**Behavior:** clicking a Scenario card filters/highlights the timeline + conflicts relevant to that scenario.

---

### 5) Targets (optional at Sequencer stage)

**Job:** let the user declare constraints early.

Examples:

- `Target: Replace EBS globally by 2027`
- `Budget ceiling: $X`
- `Holiday blackout windows`

Sequencer should respond with feasibility and tradeoffs; ROI/TCC refinement can happen later.

---

## ALE/EAgent Learning Hooks

### What to log (telemetry)

- `conflict_detected` (rule, objects, overlap window)
- `conflict_reviewed` (agree/disagree, adjustments, reason)
- `risk_posture_updated` (project-level)
- `target_infeasible` (which constraint broke)

### What ALE should learn

- False positive patterns in conflict rules (e.g., “shared integration but separate teams + feature flags”).
- Risk posture calibration over time **at project level**.
- Which conflict types predict real delays (later correlation).

> Note: This is not HR analytics. It’s sequencing calibration.

---

## Non-goals

- Turning Sequencer into an ROI/TCC dashboard (that’s a separate scene).
- Over-engineering: keep it minimal, explainable, and fast.

---

## Acceptance Criteria

- A user can glance at Sequencer and immediately understand:
  1. what the plan is,
  2. where it’s risky/conflicting,
  3. what each scenario is trying to prove,
  4. what decision(s) must be made next.
- Conflicts are explainable (with the rule + overlap + object).
- Scenario cards are not duplicates of stages.

