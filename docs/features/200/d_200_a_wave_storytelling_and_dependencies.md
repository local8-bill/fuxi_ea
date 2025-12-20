# D200A — Wave Storytelling and Dependencies

## Purpose

Overlapping waves are allowed, but a stacked timeline can tell a false story (e.g., “Wave 1 and Wave 4 start the same year so they must be the same thing”). This addendum makes wave relationships explicit so the UI can explain **parallelism vs dependency vs collision**.

This adds:

1) a **WaveDependencySet** artifact,
2) a simple **shared-change pressure score** between waves,
3) UI rules to render the true narrative (not just rectangles on a timeline).

---

## A1 — WaveDependencySet

**Output artifact:** `WaveDependencySet`

### Minimum contract (WaveDependency)

- `waveDependencyId`
- `fromWaveId`
- `toWaveId`
- `type`
  - `REQUIRES` (toWave cannot start until fromWave reaches a gate)
  - `BLOCKS` (co-existence invalid; must be sequenced)
  - `SHARES_CHANGE_PRESSURE` (parallel allowed but risky/expensive)
  - `INDEPENDENT` (explicitly recorded / proven independent)
- `gateStageId?` (if `REQUIRES`/`BLOCKS`)
- `objects[]` (systemIds + integrationIds that justify the link)
- `evidence[]`
  - `source` (graph_edge | stage_dependency | rule | user_decision | heuristic)
  - `note`
- `confidence` (0–1)

**Rule:** every non-trivial relationship shown in UI must be backed by a WaveDependency entry.

---

## A2 — Shared-change pressure score

This is **not** a conflict count. It’s an at-a-glance explanation of why overlapping waves feel confusing: they share components.

**Output field:** `wavePressureMatrix[w1][w2] -> 0..100`

### Inputs

Derived from Stage 2/3 fields in D200:

- overlap window between waves
- intersecting `systemsTouched[]`
- intersecting `integrationsTouched[]`
- change types involved (replace/decouple/retire > build/config)
- optional: team ownership / feature-flag separation (reduces pressure)

### Simple MVP heuristic (explainable)

- `+30` per shared system under active change during overlap
- `+20` per shared integration under active change during overlap
- `+25` if either side is `decouple` or `retire` (high blast radius)
- `+15` if dual-run flags are present in either wave’s stages
- `-20` if user marks independence (Calibration → `INDEPENDENT`)

Persist the computed score per pair so the UI is stable and auditable.

---

## A3 — Rendering rules

When two waves overlap, the user must be able to answer in 5 seconds:

- Are these intentionally parallel?
- Do they depend on each other?
- Are they stepping on the same systems/integrations?

### Minimum UI rules

1) **Show dependency, not just time**
   - If `REQUIRES` or `BLOCKS` exists, draw a thin connector line between waves (or a gate marker on the timeline).
   - Clicking the connector opens the inspector (objects + evidence).

2) **Show “pressure badges” on waves**
   - If a wave overlaps any other wave with pressure ≥ threshold (e.g., 60), add a small badge: `Shared-change: High`.
   - Badge click opens the list of shared systems/integrations.

3) **Wave stacking should reflect intent**
   - Default stack order: `critical path (has REQUIRES links)` → `high pressure` → `independent`.
   - If user marks waves as independent, visually separate them into sub-lanes.

4) **Highlight-by-selection**
   - Clicking a stage/wave highlights its `systemsTouched[]` and `integrationsTouched[]` in the graph below.
   - If the selected wave overlaps another, fade everything else and emphasize shared objects.

---

## A4 — Don’t mix dependencies and conflicts

- **Dependency** answers: “Can Wave B start without Wave A?”
- **Conflict** answers: “While both run, do they share-change something that raises risk/cost?”

A wave can be dependent without being conflicting (pure prerequisite), and conflicting without being dependent (parallel lanes touching the same integration).

---

## A5 — Storage & feedback loop

- Store `WaveDependencySet` with the sequence snapshot (D200 Stage 4).
- User overrides (“these waves are independent”, “Wave B must wait for Gate X”) become **DecisionLog** entries and update dependencies.
- Calibration events reduce false positives (e.g., `INDEPENDENT` reduces pressure and prevents repeated nags).

---

## Telemetry additions

- `wave_dependency_inferred`
- `wave_dependency_overridden`
- `wave_pressure_computed`
- `wave_pressure_reviewed`

