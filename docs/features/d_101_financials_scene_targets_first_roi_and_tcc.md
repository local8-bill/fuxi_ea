# D101 — Financials Scene Targets-first ROI and TCC

## Purpose
Build the **Financials (ROI/TCC) scene** so it answers the real executive questions:

- “What are we spending, when, and why?”
- “Capex vs Opex?”
- “Do we need more people?”
- “What systems are we turning off, when, and what savings do we realize?”
- “What NEW business capabilities are we buying?”
- “Is the org ready for this plan?”

This scene is not a second Sequencer.
- **Sequencer** = plan + conflicts + scenarios.
- **Financials** = targets + feasibility + forecast + explainability.

---

## Naming Standard
- **Directives:** `D### — <short title>` (this doc)
- **Design Docs:** `DD### — <short title>`
- **Math Explainers:** `M### — <short title>` (e.g., “Architecture Math Explainers”)
- **Datasets / Seeds:** `S### — <short title>`

---

## Outcomes

### O1 — Targets-first feasibility
User enters targets first; the scene returns:
- **Feasible / Not feasible**
- **What constraint breaks** (budget, time, blackout windows, staffing capacity)
- **Minimum viable adjustment** suggestions (move target date, increase budget, reduce scope, change rollout strategy)

### O2 — CFO-ready narrative + drilldown
At a glance: 1–2 paragraph executive summary.
Then: “show your work” drilldowns for spend, people, savings, retirement, and assumptions.

### O3 — Explainability everywhere
Every number is traceable to:
- a stage/system input
- a formula
- a rule/assumption

(See: **Fuxi_EA Architecture Math Explainers**.)

---

## Page Sections and Requirements

### 1) Targets Panel (top)
User inputs (MVP):
- **Target date** (e.g., “EBS off order flow globally by FY28”)
- **Budget ceiling** (range or fixed)
- **Capex/Opex preference** (optional)
- **Holiday blackout window** (default: Nov 1 → Jan 15)
- **Headcount constraint** (optional: “max 12 FTE average / 18 peak”)

Output:
- **Feasibility status** (green/yellow/red)
- **Constraint breakers** (plain language)


### 2) Executive Summary Card
A CFO-friendly summary that reads like:
- “Over the next 3–5 years we are funding X to achieve Y, primarily driven by A/B/C.”
- “Peak spend occurs in <period>, driven by <systems/integrations/dual-run>.”
- “We retire <systems> by <date>, realizing <savings> starting <date>.”
- “Net ROI crosses break-even at <month/quarter> (or does not within horizon).”


### 3) Spend Forecast (the money picture)
Required visuals:
- **Spend over time** (monthly/quarterly)
- **Capex vs Opex** overlay
- **TCC composition** stacked bar (stageCost/resources/operational/risk/governance)

Required interactions:
- Hover/click reveals **which stages** contribute to a period.


### 4) People Model (the reality check)
Because “we haven’t touched on people” becomes “we got surprised later.”

Required:
- **FTE over time** (min/avg/peak)
- Cost rollup from `resourceHeadcount × hourlyRate × durationHours`
- Ability to set a **capacity ceiling** and re-run feasibility


### 5) Systems Replacement and Savings Ledger
A “what turns off when” table.

Required fields per system:
- Current run cost (license + ops)
- Retirement milestone/date
- Savings start date (typically after stabilization)
- One-time exit cost (optional)

Outputs:
- “Systems being replaced” list
- “Savings realized by year”


### 6) Capabilities Gained
Make the value concrete.

Each stage or scenario can declare:
- `capabilitiesGained[]` (e.g., “Cross-channel ATP”, “Real-time returns disposition”, “B2B invoicing modernization”)

Show:
- Capabilities timeline (when it becomes true)
- Which channels/regions benefit


### 7) Readiness & Risk (lightweight, honest)
MVP readiness is not a psych eval; it’s gating signals.

Inputs (examples):
- B2B process definition maturity
- Data readiness (store lists, brand/region mapping completeness)
- Vendor decision confidence (e.g., “MFCS-ish contingency”)

Outputs:
- Readiness flags that directly affect feasibility (e.g., “B2B definition missing → cannot schedule B2B-first without risk premium”).

---

## Data Contract

### A) Minimum per-stage financial inputs (aligns with `totalCostOfChange()`)
Each stage should be able to supply or derive:
- `stageId` (links to Sequencer)
- `systemId` (or `systemIds[]`)
- `baseStageCost`
- `integrationCount`
- `integrationCost`
- `dualRunPenalty`
- `resourceHeadcount`
- `hourlyRate`
- `durationHours`
- `operationalImpactPercent` (optional)
- `domainRevenue` (optional)
- `riskFactor` (default 0.1)
- `governancePercent` (default 0.08)

Outputs from calculator (stored for explainability):
- `tcc.total`, `tcc.stageCost`, `tcc.resources`, `tcc.operational`, `tcc.risk`, `tcc.governance`


### B) Targets object (scene-level)
- `targetId`
- `targetType` (e.g., `retireSystem`, `decoupleFlow`, `globalRolloutByDate`)
- `systemOrDomain`
- `byDate`
- `budgetCeiling`
- `capexPercent` / `opexPercent` (optional)
- `blackoutWindows[]`
- `capacityCeilingFTE` (optional)


### C) Capex/Opex + depreciation
For each spend line (stage/system) allow optional:
- `capexEligiblePercent`
- `opexPercent`
- `depreciationLifeMonths`
- `capitalizationStart` (date)

If unknown, default to a simple policy and show it as an assumption.

---

## Feasibility Rules (MVP)
A plan is **not feasible** if any of these are true:

1) **Time:** required go-lives/cutovers land inside blackout windows.
2) **Budget:** cumulative spend exceeds budget ceiling.
3) **Capacity:** required FTE peaks above ceiling.
4) **Hard dependency:** a stage depends on a missing prerequisite (e.g., vendor decision, data asset, integration baseline).

Each failure must produce:
- constraint name
- which stages caused it
- recommended adjustment(s)

---

## Explainability Hooks
Every chart/number has a “Why?” drawer:
- Inputs used
- Formula used (from Math Explainers)
- Any defaults/assumptions applied

---

## Telemetry (feeds ALE, stays project-level)
- `financial_target_set`
- `financial_feasibility_run`
- `financial_infeasible` (constraint, stageIds)
- `tcc_computed` (already defined)
- `roi_break_even_reached` (already defined)
- `assumption_applied` (e.g., default depreciation, default integration cost)

---

## Acceptance Criteria
- A CFO can read the summary and understand **what we’re buying, when, and why**.
- A detail-oriented exec can click “show your work” and see:
  - spend forecast
  - capex/opex
  - staffing needs
  - systems replaced + savings timeline
  - capabilities gained
  - readiness gates
- Feasibility can say **“No”** clearly, with the exact constraint breaker.

