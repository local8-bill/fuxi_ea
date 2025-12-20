# D200 — Scenario Refinement Workflow and Role-based Reviews

## Purpose

Define the end-to-end **human + agent workflow** for turning a messy, coarse-grained “Build a Scenario” idea into a **credible, explainable sequence** — then stress-testing it with role-based reviews (CFO mode, Ops mode, etc.) using EAgent/Mistral.

This directive is the **process spine** that connects:

- **Twin → Scenario → Sequencer (refine)**
- **Sequencer → Save → Run alternatives**
- **Sequencer → Role Reviews → ROI/TCC scene**

---

## North Star Outcome

A user can:

1) declare an intent (goal + constraints),
2) generate an initial rough sequence,
3) refine it into a defensible plan,
4) capture decisions/conflicts with provenance,
5) run role-based “murder room” reviews,
6) then graduate into ROI/TCC with the right level of detail.

---

## Core Mental Model

### The user’s journey

1. **Build a Scenario** (natural language)
2. **Land in Sequencer** (coarse and likely ugly)
3. **Refine the sequence** (interactive + explainable)
4. **Save a candidate plan** (Versioned)
5. **Run another variant** (A/B sequencing)
6. **Role-based review** (Architect / CFO / Ops / Readiness)
7. **Financials deep dive** (ROI/TCC scene)
8. **Feed learnings back to sequencing** (targets, gates, constraints)

### What Sequencer is (and isn’t)

- Sequencer is **plan clarity + decision capture**.
- Sequencer is **not** the ROI/TCC dashboard.
- Sequencer can support **Targets-first** feasibility, but it must avoid ROI/TCC “spray paint” everywhere.

---

## Workflow Stages

### Stage 0 — Scenario Intent Capture (Right Rail)

**Input:** natural language intent

Example:
- “Roll out OMS globally by 2030, include all physical stores.”

**Minimum structured extraction:**
- `target`: global OMS rollout by year
- `scope`: regions, brands, channels, store footprint
- `constraints`: holiday blackout, budget ceiling, no-go policies

**Output:** `ScenarioIntent` object + provenance (raw user text).

---

### Stage 1 — Seed Sequence Generation (Coarse Draft)

**Goal:** create a usable first draft quickly.

**Inputs:**
- ScenarioIntent
- Store location dataset (if present)
- Known system graph (systems + integrations) from the asset ingest

**What happens:**
- Create coarse waves/stages using heuristics (region-first, pilot-first, channel-first, etc.)
- Attach a preliminary system/integration footprint per stage

**Output:** Draft `Sequence` + visible note: “This is a draft — refine next.”

---

### Stage 2 — Refinement Loop (Sequencer Toolkit)

**Primary objective:** reduce cognitive load by guiding the user through **the next best refinements**.

Refinement prompts (examples):
- “Do we have a list of all retail locations?” (if missing)
- “Which region is a good pilot and why?”
- “Which brand is the best test candidate and why?”
- “What known blockers exist (data, org readiness, vendor uncertainty)?”

**Refinement actions (toolkit):**
- Split/merge stages
- Drag dates, adjust wave overlap
- Apply blackout windows
- Swap region sequencing
- Toggle B2B/B2C phasing strategy
- Add/record decisions (MFCS-first vs direct)

**Output:** A “candidate” plan that is legible and defensible.

---

### Stage 3 — Conflicts → Decisions (Explainable)

Conflicts are not just warnings — they become **decision points** when severity is meaningful.

**Mechanics:**
- Conflicts discovered (system/integration overlap, dependency overlap, split-brain windows)
- Conflict Drawer shows:
  - what collides
  - why it’s a conflict (rule)
  - what systems/integrations are involved
  - what stages/waves are implicated

**User action:**
- Confirm / lower / raise severity
- Optional reason chips (teams independent, feature flags, known dependency, etc.)

**Output:**
- Conflict record + calibration (feeds Risk Posture)
- Decision record if conflict implies a fork (e.g., “MFCS-first required”).

---

### Stage 4 — Save Plan + Run Alternatives

Once the sequence is “decent”:

- Save as a versioned artifact: `SequenceCandidate` (A)
- Allow cloning → tweak strategy → save as (B)

Key rule:
- The system must preserve **provenance** (why the plan looks like this).

---

### Stage 5 — Role-based Review (EAgent / Mistral)

This is the “murder room.” Same plan, different reviewer lenses.

#### Review modes

1) **Architect Mode**
- dependency integrity
- sequencing logic
- integration load
- split-brain risk

2) **CFO Mode**
- spend forecast shape (capex/opex placeholders)
- when systems retire → when savings begin
- staffing deltas and timing
- depreciation timing (placeholder rules)
- feasibility against budget + timeline targets

3) **Ops / Program Mode**
- cutover windows
- release train realism
- regional change management intensity

4) **Readiness Mode**
- org maturity gates
- missing process definition risk (classic B2B trap)
- data quality and ownership gaps

#### Output contract (all modes)
- `Findings[]` with:
  - severity
  - evidence link (stage/system/integration)
  - recommended change (actionable)
  - “what to decide” (if it’s a fork)

**Critical rule:** the agent must be able to say: **“You can’t hit that target.”**

---

### Stage 6 — Financials Scene (ROI/TCC)

Only after the sequence is credible do we “turn on the finance microscope.”

Sequencer provides:
- stage list
- systems/integrations touched
- overlap windows
- decisions + conflicts + risk posture

ROI/TCC scene computes:
- costs/benefits by stage and over time
- TCC composition (project/transition/ops/human/risk)
- break-even and ROI curve

**Return path:**
- financial findings can create new constraints/targets back in Sequencer.

---

## Where Store Location Data Applies

Store location data is used to:

- compute scenario **scope** (store count by region/brand)
- create candidate **pilot regions** (manageable size)
- influence **sequencing heuristics** (region rollouts)
- inform **integration pressure** (store systems touched, channel complexity)

In short: store data turns “global rollout” into a **real** footprint.

---

## UI Placement Rules

- **Left Nav** = Sequence Toolkit (actions)
- **Right Rail** = Navigator (explanations + mode switches + drawers)
- Conflicts are resolved via **Drawer**, not a giant tile.

---

## Data + Telemetry Requirements

### Persisted artifacts
- `ScenarioIntent`
- `SequenceDraft`
- `SequenceCandidate` (versioned)
- `Conflict` (with rule + calibration)
- `Decision` (forks)
- `RoleReviewRun` (mode + findings)

### Telemetry events
- `scenario_intent_created`
- `sequence_seed_generated`
- `sequence_refined`
- `conflict_detected`
- `conflict_reviewed`
- `decision_created`
- `sequence_saved`
- `role_review_run`
- `role_review_finding_accepted`
- `target_infeasible`

---

## Acceptance Criteria

- A first-time user can land on Sequencer and immediately understand:
  - what they’re trying to achieve,
  - what the next refinement step is,
  - what the big risks/conflicts are (and why),
  - what decisions they must make.

- The system supports:
  - saving multiple candidate sequences
  - running role reviews that produce actionable findings
  - escalating “conflicts” into “decisions” when warranted

- The agent can plainly state infeasibility when constraints cannot be met.

