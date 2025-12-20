# D101 — Targets-first Feasibility Gate

## Purpose

Make Sequencer honest and useful **before** ROI/TCC is fully known.

Users declare **Targets** (timeline/budget/scope/constraints). Sequencer responds with:

- **Feasible / At-risk / Not feasible**
- a short, explainable **why** (the blockers)
- the **minimum required changes** to make it feasible (tradeoffs)

This prevents “pretty plans that can’t happen” and sets up ROI/TCC as *refinement*, not guesswork spam.

---

## What counts as a Target

Targets are the user’s intent constraints. Minimum set:

- **Goal**: e.g., `Replace EBS in order flow globally`
- **Deadline**: e.g., `by FY28` (or date)
- **Scope**: region(s), brands, channels (B2B/B2C), store footprint (optional but preferred)

Optional but powerful:

- **Budget ceiling**: cap or range
- **Blackout windows**: e.g., holiday freeze
- **Non-negotiables**: “No dual-run > 6 months”, “No Big Bang”

---

## Core UX

### Targets panel (Sequencer)

- Lives in Sequencer (left rail is fine)
- Clean inputs: deadline + scope + budget + blackout
- One button: **Check feasibility** (or auto-run on change)

### Feasibility banner (top of timeline)

- **Green**: feasible
- **Amber**: feasible with risk / requires concessions
- **Red**: not feasible

Banner must show:

- Status label
- 1–3 top blockers (human-readable)
- a “Show details” affordance

### Feasibility Details (right rail drawer)

Show the explanation stack:

- **Schedule**: minimum time required vs target
- **Collision pressure**: overlapped systems/integrations during waves
- **Capacity**: headcount/velocity assumptions (even if rough)
- **Constraints violated**: blackout, dual-run limits, dependency gates

Include **What-if controls**:

- Change deadline: `+6 months`, `+12 months`, `+24 months`
- Reduce scope: drop regions/brands/channels
- Relax constraint: allow longer dual-run, or allow a bridge pattern

> If the user says “it’s going to take 5 years”, Sequencer should instantly show what becomes possible and what remains blocked.

---

## How feasibility is computed (explainable, not fancy)

### Step 1 — Build a required-work baseline
Use only what we **know** at sequencing time:

- number of stages
- systems touched
- integrations touched
- known dependency gates (MFCS-ish required, EBS ledger decouple, etc.)
- store footprint (if available)

### Step 2 — Estimate minimum duration
Duration is derived from:

- stage durations (explicit or heuristic)
- required ordering constraints (dependencies)
- blackout windows
- collision pressure (overlap on same system/integration increases “effective duration”)

### Step 3 — Estimate minimum cost (rough)
At sequencing time we don’t pretend we have precise ROI/TCC.

We compute **floor estimates**:

- integration churn: `integrationsTouched × costPerIntegration`
- dual-run penalties (if overlap is required)
- resource labor assumptions (headcount × rate × hours)

> We can optionally use an external “cost snapshot” doc as *calibration defaults* (ranges), but it must remain a reference—never a hidden magic constant.

### Step 4 — Produce a FeasibilityResult

- status
- violated constraints
- top blockers
- recommended tradeoffs

---

## Minimum data contract (for DX)

### Targets

```ts
export type TargetScope = {
  regions: string[];      // e.g. ["CA", "US"]
  brands?: string[];      // e.g. ["Teva"]
  channels?: ("B2B"|"B2C")[];
  storeFootprint?: {
    storeCount?: number;
    byRegion?: Record<string, number>;
  };
};

export type Targets = {
  targetId: string;
  goal: string;
  deadline: { type: "FY"|"DATE"; value: string };
  budget?: { min?: number; max?: number; currency: string };
  blackoutWindows?: { start: string; end: string; label?: string }[];
  constraints?: {
    maxDualRunMonths?: number;
    noBigBang?: boolean;
    requiredSystems?: string[];  // e.g., MFCS-ish
  };
  scope: TargetScope;
};
```

### Feasibility output

```ts
export type FeasibilityStatus = "FEASIBLE" | "AT_RISK" | "NOT_FEASIBLE";

export type FeasibilityBlocker = {
  code:
    | "SCHEDULE_TOO_SHORT"
    | "BUDGET_TOO_LOW"
    | "BLACKOUT_CONFLICT"
    | "DEPENDENCY_GATE"
    | "COLLISION_PRESSURE"
    | "CAPACITY_LIMIT";
  severity: 1|2|3;                 // 3 = hard stop
  summary: string;                  // human readable
  evidence: {
    relatedStageIds?: string[];
    systems?: string[];
    integrations?: string[];
    window?: { start: string; end: string };
    estimate?: { needed?: number; available?: number; units?: string };
  };
  suggestions?: string[];           // tradeoffs
};

export type FeasibilityResult = {
  status: FeasibilityStatus;
  confidence: number;               // 0–1
  blockers: FeasibilityBlocker[];
  minRequired?: {
    durationMonths?: number;
    budgetFloor?: number;
  };
  whatIf?: {
    deadlinePlusMonths?: Record<number, FeasibilityStatus>;
  };
};
```

---

## Store location data usage (make it real)

When store footprint exists, use it to:

- compute **blast radius** for regional rollout stages
- weight collision severity (more stores = higher operational risk)
- estimate rollout duration (storeCount × per-store cutover overhead)

This keeps sequencing grounded in reality instead of vibes.

---

## ALE / learning hooks

Log:

- `targets_set` (deadline/scope/budget/constraints)
- `feasibility_checked` (result + blockers)
- `target_tradeoff_applied` (what changed)
- `target_infeasible` (hard-stop blocker)

Learn:

- which blockers predict real delays later (feedback loop)
- project-level risk posture interactions (D100A)

---

## Acceptance Criteria

- A user can enter: “Replace EBS globally by 2027” and Sequencer will **clearly say yes/no** with reasons.
- Feasibility explanations always point to concrete evidence (stages/systems/integrations/windows).
- What-if adjustments (e.g., “make it 5 years”) update the feasibility outcome immediately.
- No ROI/TCC spam on Sequencer—only feasibility + blockers + tradeoffs.

