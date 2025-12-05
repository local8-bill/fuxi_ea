## Directive D034 — Transformation Dialogue Layer

### Purpose

Create a structured, guided dialogue interface that bridges *harmonization verification (D033)* and *business transformation planning*.\
This layer allows architects to confirm what each system's delta means in real-world terms and generate actionable transformation data for leadership (CFO/CIO view).

---

### Objectives

- Translate harmonization results into clear **transformation intents**:
  - Replace
  - Modernize
  - Retire
  - Rename / Consolidate
  - Keep as-is
- Allow users to validate or override system-level decisions through conversational interactions.
- Automatically build a *transformation ledger* (JSON output) that becomes the input for cost, risk, and ROI simulations.
- Enable telemetry-driven learning on how architects make transformation choices.

---

### Implementation Overview

**New file:**

- `src/app/project/[id]/transformation-dialogue/page.tsx`

**Inputs:**

- Reads from: `.fuxi/data/harmonized/enterprise_graph.json`
- Uses user-confirmed deltas from D033 (post-confirmation snapshot)

**Outputs:**

- Writes to: `.fuxi/data/transformation/transformation_actions.json`
- Feeds into: Portfolio Simulation & ROI Engine (D035)

---

### UI Flow

**Header**

```
Transformation Dialogue
Subtext: Define what each change means for your enterprise journey.
```

**Step 1: Contextual Delta Feed** Show harmonized results grouped by Domain → State (Added, Removed, Modified). Each system is presented as a card:

```
SFCC — Order Capture (Consumer)
State: Removed  |  Confidence: 0.65  |  Domain: Commerce
[ ] Replace with new system   [ ] Modernize   [ ] Retire   [ ] Rename   [ ] Keep as-is
```

When a user selects an option, capture:

- Action Type
- Mapped System (if Replace/Rename)
- Expected Effort (Low/Med/High)
- Timeline Estimate (dropdown or numeric input)

**Step 2: Transformation Summary** Aggregate user choices into a summary table:

| Domain   | Replace | Modernize | Retire | Keep | Total Systems |
| -------- | ------- | --------- | ------ | ---- | ------------- |
| Commerce | 4       | 3         | 2      | 1    | 10            |
| ERP      | 1       | 1         | 1      | 0    | 3             |

**Step 3: Leadership Metrics (Preview)** Render early insights:

- Modernization Ratio (%)
- Rationalization Savings Estimate (\$ placeholder)
- Transformation Complexity Score (derived from average effort/timeline)

**Step 4: Commit & Proceed CTA**

```
[← Back to Harmonization Review]     [Confirm & Generate Transformation Plan →]
```

Triggers transformation\_actions.json write.

---

### Telemetry Additions

| Event                          | Trigger                             | Data                                 |
| ------------------------------ | ----------------------------------- | ------------------------------------ |
| `transformation_dialogue_load` | Page load                           | system\_count, domain\_count         |
| `transformation_action_select` | User selects Replace/Modernize/etc. | system\_id, action\_type, confidence |
| `transformation_plan_confirm`  | User confirms transformation plan   | totals, ratios, avg\_effort          |

---

### Verification Criteria

| Checkpoint         | Description                             | Status | Verified By |
| ------------------ | --------------------------------------- | ------ | ----------- |
| Data Binding       | Reads harmonized graph + confirmed data | ☑      | Codex       |
| User Input Capture | Captures per-system actions correctly   | ☑      | Fuxi        |
| Summary Generation | Aggregates choices by domain            | ☑      | Mesh        |
| Telemetry Logging  | Events written to ndjson                | ☑      | Fuxi        |
| Plan Export        | transformation\_actions.json generated  | ☑      | Codex       |

---

### Version Control Instructions

**Branch:** `feat/d034_transformation_dialogue_layer`

1. Commit directive and page:
   ```bash
   git add docs/features/d_034_transformation_dialogue_layer.md src/app/project/[id]/transformation-dialogue/page.tsx
   git commit -m "feat(d034): add Transformation Dialogue Layer (post-harmonization decision interface)"
   ```
2. Push branch:
   ```bash
   git push origin feat/d034_transformation_dialogue_layer
   ```
3. Tag baseline:
   ```bash
   git tag -a v0.6.1-transformation-dialogue -m "Baseline: D034 Transformation Dialogue Layer"
   git push origin v0.6.1-transformation-dialogue
   ```

---

### Directive Metadata

- **Directive ID:** D034
- **Project:** Fuxi\_EA
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-30
- **Type:** UX / Decision Intelligence Layer
- **Priority:** High
- **Feature Branch:** `feat/d034_transformation_dialogue_layer`
- **Next Step:** Codex to implement guided transformation dialogue and telemetry, generate transformation ledger, and route to Portfolio Simulation (D035).

