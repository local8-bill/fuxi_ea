# D100A — Risk Posture Learning & Provenance

## Purpose
Add **Risk Posture** as a first-class, explainable **project-level** metric that is learned from user decisions during sequencing (especially conflict review). Risk Posture influences collision severity, contingency overlays (TCC/ROI), gating strictness, and feasibility warnings (e.g., “you can’t hit 2028”).

This is explicitly **behavioral and context-based**, not “personality analytics.”

---

## Definitions

### Risk Posture
A **calibration value (0–1)** representing how aggressively the program tends to accept risk in sequencing decisions.

**Outputs**
- `risk_posture.score` (0–1)
- `risk_posture.band` (`Guarded | Balanced | Aggressive`)
- `risk_posture.confidence` (0–1)
- `risk_posture.last_updated`

### Decision Event
A single user action taken in response to a detected conflict, captured with provenance.

---

## Where It Lives in UX

### Conflict Inspector (Right Rail)
- Shows the conflict summary and recommended actions.
- User can **agree/disagree** with the conflict severity, optionally add evidence.

### Drawer (shadcn/ui)
Used to present conflict details without obscuring the timeline.
- **Small form:** systems + integrations causing the collision
- **Expanded:** justification, evidence, and impact preview

**Goal:** Keep the page useful at a glance while enabling deep inspection on demand.

---

## Telemetry + Persistence

### Decision Event Schema
Persist every conflict decision as an event.

```ts
export type ConflictDisposition =
  | 'accept'
  | 'mitigate'
  | 'resequence'
  | 'split_wave'
  | 'defer';

export type EvidenceType = 'none' | 'note' | 'link' | 'artifact';

export interface ConflictDecisionEvent {
  event_type: 'conflict_decision';
  project_id: string;
  scenario_id: string;
  sequence_id: string;

  conflict_id: string;

  // user action
  selected_disposition: ConflictDisposition;

  // user calibration
  severity_adjustment: -2 | -1 | 0 | 1 | 2; // user agrees/disagrees + magnitude
  confidence: number; // 0..1
  evidence_attached: EvidenceType;

  // provenance
  timestamp: string; // ISO
  domain?: string; // optional
  notes?: string; // optional
}
```

### Risk Posture Aggregate (Project-level)
Computed from the event stream (with recency weighting).

```ts
export interface RiskPosture {
  score: number; // 0..1
  band: 'Guarded' | 'Balanced' | 'Aggressive';
  confidence: number; // 0..1
  last_updated: string; // ISO

  // provenance for explainability
  n_events: number;
  window_days: number;
}
```

---

## Computation Model (Explainable)
Risk Posture is computed from decisions across conflicts. This is **not** about individuals; it’s an emergent program tendency.

### Inputs
Derived from `ConflictDecisionEvent`:
- Acceptance Rate: how often disposition is `accept`
- Mitigation Preference: how often `mitigate | resequence | split_wave | defer`
- Severity Downshift Tendency: how often `severity_adjustment < 0`
- Evidence Threshold: how often `evidence_attached != 'none'`
- Schedule Aggression Proxy: how often user chooses actions that *compress* timeline when warned (optional if available)

### Example Weighted Blend
```text
risk_posture.score = clamp01(
  0.35 * acceptance_rate
+ 0.25 * downshift_rate
+ 0.20 * (1 - evidence_rate)
+ 0.20 * schedule_aggression_rate
)

risk_posture.confidence = clamp01(
  log1p(n_events) / log1p(50)
) * recency_factor
```

**Banding**
- Guarded: 0.00–0.33
- Balanced: 0.34–0.66
- Aggressive: 0.67–1.00

---

## How Risk Posture Affects Sequencer

### 1) Collision Severity Calibration
```text
severity_adjusted = severity_raw * (0.85 + 0.30 * risk_posture.score)
```
- Guarded users keep severity closer to raw.
- Aggressive posture increases how “hot” collisions appear (so warnings trigger earlier, not later).

### 2) TCC Contingency Overlay
Feed into the TCC `riskFactor` default (or multiplier):
```text
riskFactor_default = baseRisk + (risk_posture.score * postureRiskDelta)
```

### 3) Gating Strictness
Higher posture => stricter gating and earlier infeasibility warnings:
- “This cannot be accomplished by 2028 given current parallelism + integration load.”

### 4) Glance-Level UI
Single badge per sequence:
- `Risk Posture: Balanced (0.58)` with confidence indicator.

---

## Explainability Requirements
Every time Risk Posture influences a decision or score:
- Show “Why?” tooltip with the top contributing factors
- Provide provenance link: last N events used in computation

### Required API/Telemetry
- `telemetry: conflict_detected`
- `telemetry: conflict_decision`
- `telemetry: risk_posture_updated`

---

## Implementation Notes
- Default Risk Posture = Balanced until N≥5 decisions.
- Use recency weighting (e.g., last 60–120 days) so posture can evolve.
- Never label or score individuals; only project/scenario aggregates.

---

## Acceptance Criteria
1. Conflict drawer allows **agree/disagree** and disposition selection.
2. Decision events are persisted with provenance.
3. Risk Posture score updates (with confidence) and is visible at sequence level.
4. Collision severity and TCC risk overlay demonstrably change with posture.
5. Tooltips show “why” with attributable factors and event references.

