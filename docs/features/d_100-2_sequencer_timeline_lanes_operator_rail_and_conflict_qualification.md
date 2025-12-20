# D100 — Sequencer Timeline Lanes, Operator Rail, and Conflict Qualification

## Purpose
Make the **Sequencer page useful at a glance** by separating:
- **Map (Center):** timeline visualization
- **Controls + Explanations (Right Rail):** stage list, intent input, conflict inspector, evidence

Second-order benefit: enable **collision-aware sequencing** and feed **ALE situational awareness** via explainable, structured events.

---

## 1) Timeline layout (Option A)

### Primary layout (FY columns with lanes inside)
- Timeline is organized into **time columns** (default: FY).
- Each column contains one or more **lanes** (parallel work streams).
- A stage belongs to exactly **one lane**, but can reference multiple systems/integrations.

### What if the plan is 5 years (or more)?
We keep the same mental model; we just add **horizon controls + progressive disclosure**.

#### Horizon rules
- **Time scale** becomes dynamic:
  - **Short horizon (≤3 FY):** show FY columns (FY26, FY27, FY28).
  - **Medium (4–6 FY):** show FY columns but **collapse details** by default.
  - **Long (7+ FY):** switch to **macro buckets** (e.g., FY26–FY27, FY28–FY29) with drill-down.

#### Zoom modes
1. **Year view (default):** FY columns; stages show only title + conflict badge(s).
2. **Quarter view:** expands a FY column into Q1–Q4.
3. **Wave view:** shows wave slices inside the FY/Q blocks.

#### Collapsing behavior
- Years beyond the “active window” are **collapsed** into a single column group:
  - Example: `FY26 | FY27 | FY28 | FY29–FY30 (collapsed)`
- Collapsed columns display:
  - count of stages
  - count of conflicts
  - footprint summary (stores/countries)
- Clicking expands the group.

#### Practical UX: keep the map readable
- Never render more than ~3–4 full columns worth of dense cards at once.
- Use horizontal scroll with sticky headers **or** a mini “time scrubber”.
- If we exceed that, we default to macro-buckets and drill.

---

## 2) Right Rail becomes the Operator Panel
Right Rail owns actions, evidence, and explanations.

### Right Rail modules (top → bottom)
1. **Stage Jump List (sortable)**
   - Drag reorder within lane and across lanes.
   - Shows: stage title, time slice, systems touched count, integrations touched count, conflict count.

2. **Apply Intent (natural language)**
   - User enters: “Move EBS decouple earlier” or “Canada first, B2B then B2C.”
   - Runs intent → proposed reordering + reasons.

3. **Conflict Inspector**
   - When a stage is selected OR when a conflict badge is clicked.
   - Shows each conflict with qualification evidence.

4. **Selected Stage Details**
   - Systems touched
   - Integrations touched
   - Footprint (region/country/brand/store count)
   - Constraints (blackout windows, readiness gates)

### Center owns only the map
- Timeline columns + lanes + stage cards
- Minimal stats on cards (avoid repeating ROI/TCC everywhere)
- Conflict badges are the “callouts”

---

## 3) Conflict model (explainable + auditable)
A conflict exists when **two stages overlap in time** AND share a change surface.

### Taxonomy
A) **Shared System Conflict**
- Same `systemId` touched by both stages and at least one has `changeType != 'none'`.

B) **Shared Integration Conflict**
- Same `integrationId` (edge A↔B) modified/created/retired in both stages.

C) **Shared Data Contract Conflict**
- Same `contractId` (schema/topic/apiVersion) modified in both stages.

D) **Shared Cutover Surface Conflict (Footprint)**
- Same footprint dimension overlaps:
  - region/country/brand/store cluster

### Qualification evidence (what inspector displays)
For each conflict:
- **Overlap window:** start/end time slice
- **Shared object:** systemId / integrationId / contractId / footprintKey
- **Reason:** short sentence
- **Evidence:** stage A + stage B entries that caused the match

### Severity heuristic (simple)
- **High:** shared integration + shared footprint + cutover
- **Medium:** shared system OR shared footprint, but not both
- **Low:** telemetry/docs/config only

---

## 4) Store location data — where it plugs in
Store data is used to compute **Footprint** and **Blast Radius** for stages.

### How we apply it
- Each stage has a `footprint` selector:
  - by country/region
  - by brand
  - by store group/cluster (optional)
- Store dataset provides:
  - store counts by country/brand
  - overlap checks between stages
  - severity uplift (more stores = larger blast radius)

### Outcomes
- Enables **Shared Cutover Surface conflicts** (type D)
- Enables timeline “at a glance” footnotes:
  - `CA (34 stores)` vs `US (128 stores)`

---

## 5) Minimum data contract DX needs
The Sequencer map can render with just these fields.

### Stage (minimum)
```ts
export type TimeSlice = {
  fy: number;              // e.g., 2026
  quarter?: 1|2|3|4;
  wave?: number;           // optional
  start?: string;          // ISO optional
  end?: string;            // ISO optional
};

export type StageTouch = {
  systemId: string;
  changeType: 'create'|'modify'|'retire'|'none';
};

export type IntegrationTouch = {
  integrationId: string;   // stable edge id
  fromSystemId: string;
  toSystemId: string;
  changeType: 'create'|'modify'|'retire'|'none';
};

export type Footprint = {
  countries?: string[];    // e.g., ['CA']
  regions?: string[];
  brands?: string[];       // e.g., ['Teva']
  storeIds?: string[];     // if known
};

export type Stage = {
  id: string;
  title: string;
  laneId: string;
  time: TimeSlice;

  touches: StageTouch[];
  integrations: IntegrationTouch[];
  contracts?: { contractId: string; changeType: 'create'|'modify'|'retire'|'none' }[];

  footprint?: Footprint;
  constraints?: { type: 'blackout'|'readiness'|'dependency'; note: string }[];
};
```

### Sequence (minimum)
```ts
export type Sequence = {
  id: string;
  title: string;
  horizon: { startFY: number; endFY: number };
  lanes: { id: string; title: string }[];
  stages: Stage[];
};
```

### Conflict output (minimum)
```ts
export type Conflict = {
  id: string;
  type: 'shared_system'|'shared_integration'|'shared_contract'|'shared_footprint';
  severity: 'low'|'medium'|'high';
  stageA: string;
  stageB: string;
  overlap: { startFY: number; endFY: number; quarters?: number[] };
  shared: { systemId?: string; integrationId?: string; contractId?: string; footprintKey?: string };
  reason: string;
  evidence: Array<{ stageId: string; matchedField: string; matchedValue: string }>;
};
```

---

## 6) ALE feed (situational awareness hooks)
Every time the user simulates/reorders/applies intent:
- emit structured events with conflict evidence.

### Events to emit
- `sequence_stage_moved`
- `sequence_intent_applied`
- `sequence_conflicts_computed`
- `sequence_conflict_acknowledged` (user viewed + accepted)

Payload includes: stage ids, overlap window, shared object, severity, footprint stats.

---

## 7) Implementation checklist for DX
1. Render **FY columns + lanes** in center.
2. Move drag list + intent input + conflict inspector to **Right Rail**.
3. Implement `computeConflicts(stages)` using taxonomy + evidence.
4. Join store dataset → stage footprint → overlap/severity.
5. Add zoom controls (Year/Quarter/Wave) + collapse years beyond active window.
6. Emit ALE events for all reorders and conflict computations.

---

## Non-goals (for now)
- Don’t plaster ROI/TCC everywhere on the sequence page.
- Don’t overfit the math yet; focus on sequencing clarity + explainable conflicts.

