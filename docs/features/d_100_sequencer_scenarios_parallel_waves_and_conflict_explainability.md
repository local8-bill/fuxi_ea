# D100 — Sequencer Scenarios, Parallel Waves, and Conflict Explainability

## Status
Draft (working directive)

## Intent
Make the **Sequencer** page useful at a glance by:
1) making **parallel waves** mentally legible,
2) separating **Scenarios (hypotheses)** from **Stages (work items)**, and
3) making **conflicts explainable + learnable** via user feedback.

This directive is about clarity-first sequencing. ROI/TCC are *not* the primary focus on this page.

---

## Core Principle
**Stages = Work. Scenarios = Hypotheses.**

- A **Stage** is a scheduled modernization unit (what we do).
- A **Scenario** is a narrative container / hypothesis about how the transformation succeeds (why we’re doing it, what we believe, what we’ll learn).

The Sequencer must not present “Scenarios” as a duplicate list of Stages.

---

## Requirements

### R1 — Scenario Model (Not a Stage Clone)
The **Scenarios list** must contain 2–5 items that are **not** stages.

Each Scenario:
- has a short hypothesis statement (1–2 lines)
- is linked to 1..N stages
- can be “activated” to change what the timeline emphasizes

**Scenario activation effects (minimum):**
- highlights linked stages
- emphasizes relevant systems/integrations
- filters/raises visibility of relevant conflicts
- surfaces relevant learning tags

**Scenario card fields (minimum schema):**
- `scenario_id`
- `name`
- `hypothesis`
- `linked_stage_ids[]`
- `success_signals[]` (simple strings)
- `learning_tags[]` (simple strings)

---

### R2 — Parallel Waves Must Be Legible (Lane Model)
The timeline must support multiple waves starting in the same FY without feeling “out of order.”

**UI rule:** Wave number is a label; chronology is shown by lanes and time.

**Minimum UX:**
- render stages by **time** and by **lane** (even if lanes are implicit)
- show overlapping stages as parallel
- ensure the user can visually infer: “these are running at the same time, on purpose.”

**Lane derivation (acceptable MVP options):**
- A) Explicit `lane_id` per stage
- B) Derived lane from `domain` (Order Mgmt / Commerce / Customer Service / Telemetry)
- C) Derived lane from “primary system touched”

---

### R3 — Conflict Detection Must Be Explainable
Every conflict must be accompanied by “why this is a conflict.”

**Conflict object fields (minimum schema):**
- `conflict_id`
- `rule_id` (e.g., `shared_integration_overlap`, `shared_system_change_overlap`, `source_of_truth_collision`)
- `severity` (Low/Med/High)
- `confidence` (0–1)
- `overlap_window` (start/end or FY/month markers)
- `shared_system_ids[]`
- `shared_integration_ids[]`
- `evidence` (counts + names for UI)


**Non-negotiable:** If we display “Conflicts: 3 (High)”, we must be able to show:
- which systems/integrations
- which stages overlap
- which rule fired

---

### R4 — Conflict Drawer + User Feedback Loop
Use a **shadcn Drawer** (or equivalent) to display the conflict details without obscuring the rest of the page.

Drawer shows:
- rule name + short plain-English explanation
- the specific stages involved
- shared systems + shared integrations (names + counts)
- overlap window
- current severity/confidence

**User feedback controls (required):**
- Agree / Disagree
- Adjust severity (Downshift / Upshift)
- Optional reason code (short list)

**Reason code suggestions (starter set):**
- `owned_by_same_team`
- `sequenced_with_feature_flags`
- `integration_is_stubbed`
- `systems_are_decoupled`
- `risk_underestimated`
- `unknown_needs_review`

Feedback creates an **ALE learning event**.

---

### R5 — ALE Events for Conflicts and Feedback
On conflict computation and review, emit these learnable events:

1) `conflict_detected`
- includes full conflict object + stage ids

2) `conflict_viewed`
- includes conflict_id + time + user role (if present)

3) `conflict_feedback_submitted`
- includes conflict_id + agree/disagree + severity adjustment + reason code

4) `risk_posture_updated`
- project-level derived metric (see R6)

---

### R6 — Project-Level Risk Posture Metric
We will track **Risk Posture** at the project level based on conflict feedback patterns.

**Definition (MVP):**
- rolling index derived from severity adjustments and disagree rates
- used only to improve defaults and explainability; not a people score

Store at:
- project scope (not individual scope)

---

### R7 — Sequencer Page Focus (De-emphasize ROI/TCC)
Sequencer is for **sequencing clarity**.

- ROI/TCC values may appear, but must not dominate or repeat so often that users ignore them.
- The primary at-a-glance value is:
  - what runs when
  - what overlaps
  - what conflicts
  - what’s the hypothesis

---

## ASCII Mental Model (Parallel Waves)

```
Time ───────────►   FY26                 FY27                 FY28

Lane A (Readiness)    [Wave 1: Canada readiness]  ──┐
                                                     ├─ conflicts if shared systems/integrations overlap
Lane B (B2C)          [Wave 4: B2C go-live + EBS] ──┘

Lane C (Regional DOMS)             [Wave 2: DOMS setup] ──────────┐
                                                                  ├─ conflicts if shared integrations touched
Lane D (Decision)                  [Wave 5: MFCS vs Direct] ──────┘

Lane E (B2B)                                           [Wave 3: B2B go-live]
Lane F (Stabilize)                                     [Wave 6: Stabilize/Prepare US]
```

---

## Implementation Notes (DX-facing)

### Minimum Stage Schema Additions (for this directive)
Add at least one of:
- `lane_id` OR `domain` OR `primary_system_id`

Stages must expose:
- `stage_id`, `name`, `time_window` (start/end)
- `systems_touched[]`
- `integrations_touched[]`

### Conflict Rules (MVP Set)
- `shared_system_change_overlap`
- `shared_integration_overlap`
- `source_of_truth_collision` (optional but high value)

### Persistence
Persist conflicts + feedback with the sequence so:
- UI can render explainability
- ALE can learn from human corrections

---

## Exit Criteria
A sequence is “ready” when:
1) Scenarios are not a duplicate list of stages
2) Parallel waves are visually legible
3) Conflicts can be inspected with explainable evidence
4) User feedback changes severity and generates ALE events
5) Risk Posture exists at the project level

