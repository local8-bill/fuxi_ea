# fuxi\_ea — Architect User Journey (Upload → ROI/TCC)

## ASCII Map (end-to-end)

```
[Upload / Data Load]
        |
        v
[Targets + Constraints] --(includes blackout Nov1→Jan15)--> [Check Feasibility]
        |
        v
[ScenarioDraft (learning card)]
        |
        v
[Sequencer Timeline: SequenceDraft v1]
        |
        +--> [Inspect] ----+
        |                 |
        |                 v
        |          [ConflictSet + Explain]
        |                 |
        |                 v
        |          [CalibrationEvent + Provenance]
        |                 |
        |                 v
        +---------> [Update Sequence / Simulate]
                          |
                          v
                 [SequenceDraft v2 / Variant]
                          |
                          v
            [Role Review: Architect Packet + CFO Packet]
                          |
                          +--> APPROVE -----------+
                          |                       |
                          +--> REQUEST_CHANGES ---+--> back to Sequencer
                          |
                          +--> SPLIT_DECISION --> [Fork variants OR Program Owner resolution]
                          |
                          v
                 [ROI/TCC Scene: FinancialModelInputs]
                          |
                          v
                   [ROITCCForecast + Explainability]
                          |
                          v
                 (feedback signals) ---> back to Sequencer
```

## ASCII Layout Contract (what lives where)

```
+--------------------+------------------------------+--------------------+
| LEFT RAIL          | CENTER (TRUTH SURFACE)       | RIGHT RAIL         |
| Inputs + selection | Timeline / Waves / Stages    | Inspector / Explain|
|--------------------|------------------------------|--------------------|
| - Data load        | - SequenceDraft view         | - Overview (none sel) |
| - Targets/constraints| - Wave grouping            | - Wave details (wave) |
| - Scenario cards   | - Stage cards (compact)      | - Stage details (stage)|
|                    |                              | - Conflicts (drill-down)|
+--------------------+------------------------------+--------------------+
Rule: If it’s a list of details -> Right rail.
Rule: If it’s changing the run -> Left rail.
Rule: If it’s the plan -> Center.
```

---

## Journey contract

**Center = timeline. Left = inputs. Right = inspector.** Sequencer is for planning clarity; **ROI/TCC is a separate scene**.

---

# Sequencer UX Simplification Plan (Merged)

## The rule (non‑negotiable)
**Simplify by subtracting defaults and density — not by adding new pages, wizards, tabs, graphs, or metric bars.**

## Priorities
- **P0: Make the timeline scannable at-a-glance** (center becomes breathable)
- **P1: Conflicts become explainable + calibratable via inspector** (drill-down, not dashboard)
- **P2: Dependencies are visible only when they matter** (selection-driven, no new mode)

---

## 1) Timeline Overhaul (keep the win, remove the noise)
**Goal:** the timeline reads like a plan, not a spreadsheet screenshot.

### A. Stage card density cap (biggest simplifier)
Stage cards show only:
- **Name**
- **Time window** (FY/Wave)
- **Up to 3 compact signals (counts, not lists):**
  - Systems touched (#)
  - Integrations touched (#)
  - Shared-change pressure (tiny indicator)

**Moves to inspector (on click):** module lists, narratives, dependency lists, conflict explanations, readiness details.

### B. Drag/reorder is a mode (not a permanent affordance)
- Keep drag-and-drop/reorder, but **only show reorder handles + stage jump list when the user is actively reordering**.
- Outside reorder mode, the UI is pure scanning + selection.

### C. Collapsible waves (progressive disclosure)
- Waves are **collapsible**; default state is **current/active wave expanded**, others summarized.
- Collapsing should reduce vertical clutter without changing the plan.

### D. Badges + tooltips (replace, don’t add)
- Badges should be **minimal** (severity via a small marker; details in inspector).
- Tooltips are allowed **only if they replace text currently shown on cards**.

---

## 2) Conflict Resolution (no wizard; inspector-driven)
**Goal:** conflicts feel like “click → understand → calibrate,” not “enter a mini-app.”

### A. Conflict inspector state (reuse the right rail)
When a conflict is selected, the right rail shows:
1. **Because** (shared system/integration + time window overlap)
2. **Impact** (what it blocks / where pressure accumulates)
3. **Mitigation** (3 standard options + custom intent)
4. **Review** (what changed + save/discard)

> This is the “wizard,” but it lives inside the existing inspector/drawer — no modal, no new flow.

### B. Conflict list behavior (D100 compliance)
- With nothing selected: **conflict summary only** (counts, top 1–2).
- With wave or stage selected: expand to **relevant conflicts only**.

### C. Calibration + learning (D100A)
- Every mitigation produces a `CalibrationEvent` with provenance.
- Risk posture updates are **project-level only**.

---

## 3) Dependencies & Coupling (D200A without a new graph page)
**Goal:** show coupling when it matters; don’t force users into a network diagram.

### A. Selection-driven dependency ribbons
- When a stage is selected: show **dependency ribbons** to connected stages (only for that selection).
- When a wave is selected: show **wave-level dependency highlights**.

### B. Shared-change pressure is the overlap truth
- Overlap is not risk.
- **Overlap touching the same system/integration = risk pressure.**
- Visualize pressure with **stripes/borders** on stage cards (subtle) and explain “why” in the inspector.

---

## 4) Navigation & Workflow (simplify defaults, not add chrome)
**Goal:** user always knows what to do next, without extra navigation UI.

### A. No new top nav / breadcrumbs / metrics bars
- Do not add tabs, breadcrumbs, or header summary metrics.
- The rails + selection are the navigation.

### B. One primary CTA
- Keep **Update Sequence** as the primary CTA.
- Keep “Apply intent” available but **collapsed by default** unless engaged.

### C. Rail defaults (single job per region)
- **Left rail = inputs only** (load data, targets/constraints, scenario select)
  - “Run setup” collapses to a one-line summary when not editing.
- **Right rail = explain what you clicked**
  - Overview only when nothing is selected
  - Stage/wave details when selected
  - Conflicts expand only in context

---

## 5) Success criteria (how we know it’s simpler)
- A user can answer “what’s happening when?” in **10 seconds** by scanning the center.
- A user can explain any conflict (“because…”) in **2 clicks**.
- Reordering feels deliberate (mode-based) and doesn’t pollute the default view.
- Timeline cards never exceed the density cap (no lists on cards).

## 6) Anti-goals (what we refuse to ship)
- No conflict wizard modal.
- No separate dependency graph page.
- No new top navigation.
- No new metric banners to ‘reduce overload’ (that’s how overload wins).

---

## 0) Entry + Context

**User intent (Architect):** sequence modernization work into feasible waves that are explainable + reviewable.

**User does**

- Selects project/workspace.
- Sets role = **Architect**.
- Enters **Sequencer**.

**System establishes**

- Active dataset context (live vs snapshot).
- Baseline constraints (incl. **holiday blackout Nov 1 → Jan 15**).

**Artifacts**

- `WorkspaceContext`

---

## 1) Upload / Data Load

**User does**

- Chooses **Load Live Data** or **Load Snapshot (.json)**.

**System does**

- Connects current source (connected state).
- Hydrates the working dataset for sequencing + downstream ROI.

**Artifacts**

- `DataSnapshot` (or `LiveContextRef`)
- `WorkspaceContext` (updated)

---

## 2) Targets + Constraints Setup (Sequencer Inputs)

**User does**

- Sets bounds/targets (FY Start/End, fiscal goal/deadline type, region/brand/channel, budget cap/currency).
- Confirms **holiday blackout** is enforced.
- Clicks **Check feasibility**.

**System does**

- Validates constraints and readiness assumptions.
- Prepares run context for scenario sequencing.

**Artifacts**

- `TargetSpec`
- `ConstraintSet` (includes blackout)

---

## 3) Scenario Selection (Learning Cards)

**User does**

- Selects a scenario card.
- Skims: scope/goal, primary risk, decision, owner, stage count, conflict count.

**System does**

- Treats scenario as the hypothesis driver for sequencing (not duplicate stages).

**Artifacts**

- `ScenarioDraft`

---

## 4) Generate / View Sequence (SequenceDraft v1)

**User sees (center timeline)**

- **Sequencer Timeline** across FY/waves.
- Stage cards grouped by wave.
- Pressure indicators (shared-change) at-a-glance.

**User does**

- Scans roadmap shape (what happens when).
- Clicks stages/waves to inspect details.

**System does**

- Produces first plan pass + baseline signals (risk posture + confidence).

**Artifacts**

- `SequenceDraft_v1`
- `WaveDependencyGraph` (derived)
- `SharedChangePressure` (derived)

---

## 5) Inspect (Right Rail = Navigator/Inspector)

**User does**

- Uses right-rail views (Architect/Overview/CFO) + badges (readiness/overlay/store impact/conflicts).
- Applies filters (e.g., conflicts only).

**System does**

- Narrows visibility without changing the plan.

**Artifacts**

- *(view state only)*

---

## 6) Conflict Detection + Drill-Down

**User sees**

- Conflict counts + list, with severity/time window cues.
- **Inspect** action.

**User does**

- Opens a conflict to see the “because…” story (coupling).
- Confirms overlap risk vs safe parallelism.

**System does**

- Explains conflicts via coupling (shared systems/integrations), per D200A.

**Artifacts**

- `ConflictSet`
- `ConflictExplanation` *(derivable view)*

---

## 7) Calibration (Learning Loop Hook)

**User does**

- Calibrates conflicts (accept/mitigate/shift timing/rebalance waves).

**System does**

- Learns **project-level** risk posture from calibration (not personal profiling).
- Updates conflict expectations + sequencing heuristics.

**Artifacts**

- `CalibrationEvent` (+ provenance)
- `RiskPosture` (project learned state)

---

## 8) Sequence Update + Simulation (SequenceDraft v2)

**User does**

- Applies intent (instruction) and/or reorders stages.
- Runs **Update Sequence**.
- Optionally **Simulate**.

**System does**

- Generates updated sequence variant.
- Logs what changed and why.

**Artifacts**

- `SequenceDraft_v2` (or variant fork)
- `DecisionLog`

---

## 9) Role Review Handoff (Architect Packet → CFO)

**User (Architect) does**

- Packages plan rationale: waves, conflicts/mitigations, pressure hotspots, feasibility notes.

**System does**

- Produces review-ready packets.
- Supports disagreement outcome state.

**Artifacts**

- `RoleReviewPacket_Architect`
- `RoleReviewPacket_CFO`
- Outcome: `APPROVE` / `REQUEST_CHANGES` / `SPLIT_DECISION` (fork variants or Program Owner resolution)

---

## 10) ROI/TCC Scene (Financial Story — Separate Scene)

## ASCII Artifact Spine (contracts)

```
DataSnapshot/LiveRef
        |
        v
TargetSpec + ConstraintSet
        |
        v
ScenarioDraft
        |
        v
SequenceDraft_v1  --->  (derived) WaveDependencyGraph
        |                       (derived) SharedChangePressure
        v
ConflictSet  ---> CalibrationEvent(+prov) ---> RiskPosture(project)
        |
        v
SequenceDraft_v2 / Variant  ---> DecisionLog
        |
        v
RoleReviewPacket_Architect + RoleReviewPacket_CFO
        |
        v
FinancialModelInputs ---> ROITCCForecast + ExplainabilityPacket
```

**User does**

- Switches to **ROI/TCC**.
- Declares success criteria + constraints:
  - Program hypothesis
  - Deadline FY
  - Budget ceiling
  - Capex preference
  - Headcount envelope

**User sees**

- Feasibility status (e.g., infeasible).
- Executive summary (total cost, net ROI, break-even, TCC ratio).
- Cost vs benefit chart.
- FTE demand + retirements/savings start.
- Explainability (inputs/formulas).

**System does**

- Converts sequence + constraints into the financial narrative.

**Artifacts**

- `FinancialModelInputs`
- `ROITCCForecast`
- `ExplainabilityPacket`

---

## 11) Feedback Loop (ROI → Sequencer)

**User does**

- If infeasible/low confidence: returns to Sequencer to rebalance waves, shift cutovers, reduce shared-change pressure.

**System does**

- Feeds feasibility signals back into sequencing decisions.

**Artifacts**

- Updated `ConstraintSet` / `DecisionLog`
- New `SequenceDraft` variant

