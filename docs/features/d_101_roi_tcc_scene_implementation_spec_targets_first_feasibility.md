# D101 — ROI/TCC Scene Implementation Spec: Targets-first Feasibility

## Purpose

Build the **ROI/TCC Financials scene** so it answers the CFO-grade questions *without* turning Sequencer into a finance wall-of-noise.

Core idea: **Targets-first feasibility**.

1) User declares **targets + constraints** (deadline, budget, capex/opex mix, blackout windows, headcount limits).
2) System produces an **explainable forecast** (spend curve + staffing + savings timing) and clearly says **“feasible / not feasible”**.
3) User can drill into “how did you get that?” down to formulas and inputs.

This scene is the place ROI/TCC belongs.

---

## Outcomes

### O1 — CFO narrative at-a-glance
A CFO can understand in 60 seconds:
- what we’re funding,
- the spend envelope by year/quarter,
- what comes offline when,
- what capabilities we gain,
- what’s risky (and why).

### O2 — Evidence / provenance on demand
A detail-driven CFO can click:
- **Inputs used** (systems, integrations, stages, assumptions)
- **Decisions made** (targets, constraints, conflict severity posture)
- **Formulas** (Math Explainers) + parameter values

### O3 — Hard truth mode
If targets are impossible, the scene must say:
- **which constraint broke**,
- **what would need to change** (time, budget, scope, sequencing, resourcing).

---

## User-facing UX requirements

### 1) Targets panel (first thing on page)
**Goal:** let the user state intent before we show math.

**Minimum fields (MVP):**
- **Deadline target** (e.g., “Replace EBS globally by 2027” or “OMS global by 2028”)
- **Budget ceiling** (total)
- **Capex/Opex preference** (slider or %)
- **Headcount envelope** (optional: baseline team size + max surge)
- **Blackout window rule** (default Nov 1 → Jan 15 yearly; editable)

**Outputs from Targets panel:**
- `feasibilityStatus`: `feasible | feasible_with_risk | infeasible`
- `constraintBreakdown[]`: (what broke / by how much)


### 2) Executive Summary block
One screen, no scrolling, answers:
- **Program hypothesis** (one-liner)
- **Total 3–5y spend** (range if uncertain)
- **Peak staffing** (FTE) + when
- **Break-even estimate** (if benefits provided) or “benefits not yet modeled”
- **Major risks** (top 3) with links to explainability


### 3) Spend Forecast (the main chart)
**What it shows:**
- forecast spend by month/quarter (stacked):
  - stage cost (system + integration + dual-run)
  - resource cost
  - operational impact
  - risk + governance overlays

**Must support:**
- Capex vs Opex view toggle
- Drill-down: click a bar segment → list of contributing stages/systems


### 4) People plan (simple, but real)
**What it shows:**
- required FTE by month/quarter
- split by role bucket (optional): Eng / Integration / QA / PM / Change

**Where it comes from:**
- stage-level `resourceHeadcount`, `durationHours`, `hourlyRate` (or role-rate table)


### 5) Replacement + Savings timeline
**What it shows:**
- “Systems replaced” with:
  - target retirement date
  - “savings start” date
  - estimated annual run-rate savings

If savings are unknown, show placeholders and say “needs input”—don’t invent.


### 6) Explainability Drawer (Math Explainers in-context)
Every computed number needs a **“How was this calculated?”** link.

Drawer includes:
- the formula (from Math Explainers)
- values substituted
- source objects (stage/system/integration IDs)
- any defaults (integrationCost, governancePercent, riskFactor)

---

## Data contract

### Inputs
The ROI/TCC scene reads:
- `Sequence` (waves → stages) from persisted sequences
- `Systems` and `Integrations` from graph/assets
- optional `FinancialAssumptions` (defaults allowed)
- optional `Targets`


### Minimum Stage financial fields (MVP)
If missing, scene must either:
- use defaults (clearly labeled), or
- mark forecast as “insufficient inputs”.

Required per stage (for usable TCC):
- `stageId`, `name`
- `start`, `end`
- `systemsTouched[]`
- `integrationsTouched[]`
- `baseStageCost` (or sizing: S/M/L/XL → estimator)
- `resourceHeadcount`
- `durationHours`

Optional but recommended:
- `hourlyRate` (or role-based rates)
- `dualRunPenalty`
- `operationalImpactPercent`
- `domainRevenue`
- `riskFactor`
- `governancePercent`


### TCC calculation alignment
Must align to the TypeScript function currently implemented:

- `stageCost = baseStageCost + integrationCount*integrationCost + dualRunPenalty*baseStageCost`
- `resources = headcount*hourlyRate*durationHours`
- `operational = (opImpact%/100)*domainRevenue`
- `risk = riskFactor*(stageCost+resources)`
- `governance = governancePercent*(stageCost+resources)`
- `total = sum(all)`


### Output ViewModel (FinancialsVM)
Return a UI-ready model:
- `feasibilityStatus`
- `constraintBreakdown[]`
- `forecastTimeline[]` (month/quarter):
  - `stageCost`, `resources`, `operational`, `risk`, `governance`, `total`
- `fteTimeline[]`
- `systemsRetirement[]`
- `explainabilityIndex` (pointer-friendly list of formula inputs)

---

## Feasibility rules (Targets-first)

### Baseline checks
A target is infeasible if any are true:
- **deadline breach**: required end date > target date
- **blackout conflict**: cutover/go-live stages overlap blackout windows
- **budget breach**: cumulative total > budget ceiling
- **capacity breach**: required FTE > max headcount envelope

### What to return (no hand-waving)
- `infeasibleReasonCodes[]` e.g. `deadline`, `budget`, `capacity`, `blackout`
- `delta` values (how far off)
- “Fix suggestions” as options, not promises:
  - add time
  - add budget
  - reduce scope
  - reorder waves
  - reduce parallelism (if conflicts drive resource peaks)


---

## Telemetry hooks (ALE feed)

Emit:
- `targets_set`
- `targets_feasibility_computed`
- `target_infeasible` (reason codes + deltas)
- `tcc_computed` (per stage + rollup)
- `roi_forecast_computed` (when benefits exist)
- `explainability_opened` (which metric)

ALE learnings:
- which constraints most often break
- which assumptions users override
- how risk posture adjustments correlate with later re-plans

---

## Implementation plan (DX-ready)

### Step 1 — Add data model plumbing
- Extend stage schema to include financial inputs (defaults allowed)
- Create `FinancialAssumptions` object with defaults:
  - `integrationCost` default
  - `governancePercent` default
  - `riskFactor` default
  - role rates (optional)

### Step 2 — Build `FinancialsVMBuilder`
- Input: `Sequence + GraphAssets + Targets + Assumptions`
- Output: `FinancialsVM`
- Ensure every computed line item stores explainability inputs.

### Step 3 — Render Financials scene
Layout order:
1) Targets panel
2) Executive Summary
3) Spend Forecast chart
4) People plan
5) Replacement/Savings timeline
6) Explainability drawer

### Step 4 — Wire telemetry
- emit on targets changes
- emit on compute
- emit on drawer open

---

## Non-goals (MVP)

- No “perfect” ROI if benefits aren’t provided.
- No external benchmarks pretending to be truth.
- No magical optimization that always finds a path.

---

## Acceptance criteria

- Can enter a target like “OMS global by 2028 + $10M cap” and get:
  - feasible status
  - spend curve
  - staffing curve
  - explainability for every number
- If infeasible, user sees:
  - exact constraints broken
  - deltas
  - options to change inputs
- Math Explainers are accessible *in the moment* (not buried in docs).

