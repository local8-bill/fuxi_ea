# Fuxi\_EA Architecture Math Explainers

> *“If we can’t explain it, we don’t deserve for them to trust it.”*

## Purpose

This document defines the financial and logical foundations behind the ROI and transformation modeling functions in Fuxi\_EA. It ensures that every system, integration, and migration cost or benefit can be explained, traced, and justified to a business or financial stakeholder.

---

## 1. Stage Cost Function

The Stage Cost Function models the **total cost** for a transformation stage:

$$
C_{stage} = \sum_i [C_{sys_i} + (DL_i \times C_{integration}) + (DRP_i \times LegacyPenalty)]
$$

### Components

| Symbol             | Description                                      | Notes                                               |
| ------------------ | ------------------------------------------------ | --------------------------------------------------- |
| **C\_sys\_i**      | Base cost to change/replace system *i*           | License + implementation cost, or T-shirt heuristic |
| **DL\_i**          | Dependency load (# of connected changed systems) | Derived from graph edges                            |
| **C\_integration** | Average cost per integration impacted            | Default \$15K–\$25K                                 |
| **DRP\_i**         | Dual-run penalty flag (1 or 0)                   | True if system overlaps old/new                     |
| **LegacyPenalty**  | Additional cost when dual-running                | Typically 10–25% of C\_sys\_i                       |

### Example

| System      | C\_sys\_i | DL\_i | C\_integration | DRP\_i | LegacyPenalty | C\_stage\_i |
| ----------- | --------- | ----- | -------------- | ------ | ------------- | ----------- |
| ERP NextGen | 250,000   | 4     | 15,000         | 1      | 0.2×250K      | 360,000     |
| CRM Cloud   | 75,000    | 2     | 15,000         | 0      | —             | 105,000     |

**Total Stage Cost = 465,000**

### Optional Adjustments

| Factor                             | Description                                             | Default                 |
| ---------------------------------- | ------------------------------------------------------- | ----------------------- |
| **RI (Ripple Multiplier)**         | Increases cost when dependent systems are also changing | 5–10%                   |
| **DCF (Domain Complexity Factor)** | Domain criticality weight                               | Finance 1.2x, Data 0.9x |
| **RLF (Resource Load Factor)**     | Resource/capacity scaling                               | Projected over timeline |

---

## 2. Stage Benefit Function

Modeled as the **expected return** or efficiency gain per stage:

$$
B_{stage} = \sum_i [(ΔP_i \times R_i) + (E_i \times T_i)]
$$

| Symbol | Description                           | Example                      |
| ------ | ------------------------------------- | ---------------------------- |
| ΔP\_i  | Productivity delta (%) for domain *i* | +10% post-modernization      |
| R\_i   | Revenue or cost baseline              | \$3M cost base               |
| E\_i   | Efficiency multiplier                 | 0.25 for automated processes |
| T\_i   | Time horizon (months active)          | 12 months                    |

### Example

If Data Modernization yields +10% productivity on a \$3M base with 25% efficiency over 12 months:

$$
B = (0.10 × 3M) + (0.25 × 12) = 300,000 + 3 = 303,000
$$

---

## 3. Payback Curve Logic (Break-Even Point)

The **Payback Curve** shows when cumulative benefits exceed cumulative costs, indicating the break-even month.

### Formula

$$
\text{BreakEvenMonth} = \min_t [\sum_{n=0}^{t} B_n - \sum_{n=0}^{t} C_n > 0]
$$

### Implementation Logic

1. Accumulate stage-by-stage costs and benefits.
2. Calculate running net ROI over time.
3. Identify the first point (month or stage) where total benefits > total costs.
4. Visualize as two intersecting curves:
   - **Cumulative Cost Curve (red):** Total investments over time.
   - **Cumulative Benefit Curve (green):** Realized savings/revenue uplift.

### Example

| Month  | Cumulative Cost | Cumulative Benefit | Net       |              |
| ------ | --------------- | ------------------ | --------- | ------------ |
| 0      | \$200K          | \$50K              | -150K     |              |
| 3      | \$950K          | \$370K             | -580K     |              |
| 6      | \$2.2M          | \$1.19M            | -1.01M    |              |
| 9      | \$3.9M          | \$3.05M            | -850K     |              |
| **11** | **\$4.8M**      | **\$4.95M**        | **+150K** | ✅ Break-even |

### Visualization Guidance

In the ROI dashboard:

- Red = cost accumulation.
- Green = benefit accumulation.
- Shaded area between = investment gap (negative ROI).
- Intersection = break-even marker with annotation “ROI > 0 at Month X”.

Telemetry should emit `roi_break_even_reached` when break-even is first achieved.

---

## 4. Stage Benefit Curve (ROI Growth Over Time)

Once benefits begin compounding, the ROI curve displays **return percentage over time**.

### Formula

$$
ROI_t = \frac{\sum_{n=0}^{t} (B_n - C_n)}{\sum_{n=0}^{t} C_n} \times 100
$$

| Month  | Net Benefit | Cumulative Cost | ROI%    |
| ------ | ----------- | --------------- | ------- |
| 0      | -150K       | 200K            | -75%    |
| 3      | -580K       | 950K            | -61%    |
| 6      | -1.01M      | 2.2M            | -46%    |
| 9      | -850K       | 3.9M            | -21%    |
| **11** | **+150K**   | **4.8M**        | **+3%** |

### Visualization Guidance

- ROI% shown as a **line chart** overlayed above the cost/benefit curves.
- Use positive (green) vs negative (red) gradient for immediate visual interpretation.
- Tooltip shows running total and contributing domains.

This view enables CFOs or transformation leads to visually validate ROI trajectory and identify which stages or domains accelerate or delay ROI.

---

## 5. Derived Metrics Reference

| Metric  | Meaning                  | Source                          |
| ------- | ------------------------ | ------------------------------- |
| **TD**  | Transformation Delta     | Harmonization: future − current |
| **DL**  | Dependency Load          | Graph edges count per node      |
| **DRP** | Dual-Run Penalty         | Transformation timeline overlap |
| **RI**  | Ripple Impact            | Domain adjacency modifier       |
| **DCF** | Domain Complexity Factor | Domain metadata weighting       |
| **RLF** | Resource Load Factor     | Team capacity/time offset       |

---

## 6. Explainability Mandate

**Directive:** Every derived ROI or cost metric must be human-explainable.

### Standards

1. **Persistence:** Each formula’s inputs (C\_sys\_i, DL\_i, etc.) are stored in harmonized data.
2. **Transparency:** API `/api/roi/forecast` returns both `display_value` and `source_formula`.
3. **Visibility:** ROI dashboard tooltips explain each derived metric.
4. **Traceability:** Telemetry logs include cost derivation events.

---

## 7. Simplified (T-Shirt) Model

For early-stage estimation, replace detailed inputs with heuristic sizing.

| Size   | Typical Range | Example                          |
| ------ | ------------- | -------------------------------- |
| **S**  | \$25K–\$100K  | 1–2 systems, <3 integrations     |
| **M**  | \$100K–\$500K | 3–6 systems, 5–10 integrations   |
| **L**  | \$500K–\$1.5M | 7–25 integrations, single domain |
| **XL** | \$1.5M+       | Multi-domain transformation      |

Mapping is controlled via `domain/services/roiEstimator.ts`.

---

## 8. Implementation Notes

- Equations implemented in `/domain/services/roiCalculator.ts`.
- Placeholder fields in financials.json should map 1:1 to variables above.
- Outputs feed ROI dashboard and telemetry.
- Payback and ROI curve logic implemented in `/api/roi/forecast`.

---

## Multi-Domain ROI Model and Narrative (D051 Reference)

### 1. Overview

This section formalizes the ROI model used across Fuxi EA’s transformation sequencer and dashboard. It defines how costs and benefits are computed by **stage**, then aggregated by **business/technical domain**.

### 2. Mathematical Model

Each transformation stage *i* is assigned to a domain *d*.

- Stage cost function \(C_i(t) = B_i(1 + \text{uplift}_i)e^{-βt} + 0.2B_i\)

- Stage benefit function \(V_i(t) = δ_i(1 - e^{-λ(t - T_{go})})\)

Per-domain totals:

$$
C_{d,t} = \sum_{i \in S_d} C_i(t), \quad
V_{d,t} = \sum_{i \in S_d} V_i(t)
$$

Domain ROI:

$$
ROI_{d,t} = \frac{V_{d,t} - C_{d,t}}{C_{d,t}}
$$

Total ROI is the weighted aggregate:

$$
ROI_t = \frac{\sum_d V_{d,t} - \sum_d C_{d,t}}{\sum_d C_{d,t}}
$$

### 3. Example Parameters

| Size | Base Cost \(B_i\) | Benefit \(δ_i\) | Integration Uplift | Decay \(β\) | Adoption \(λ\) |
| ---- | ----------------- | --------------- | ------------------ | ----------- | -------------- |
| S    | 100               | 80              | 30 %               | 0.5         | 0.3            |
| M    | 300               | 250             | 45 %               | 0.5         | 0.3            |
| L    | 700               | 700             | 60 %               | 0.5         | 0.3            |

### 4. Domain Example (15-Month Horizon)

| Domain  | Stage                        | Start | Duration | Break-Even (mo) | ROI\@15 mo |
| ------- | ---------------------------- | ----- | -------- | --------------- | ---------- |
| ERP     | ERP Modernization            | 0     | 9        | 12              | +10 %      |
| Data    | Data Warehouse Consolidation | 6     | 6        | 13              | +110 %     |
| Finance | Finance Automation           | 10    | 3        | 13              | +35 %      |

### 5. Executive Narrative (for ROI Dashboard)

- **ERP** = foundation, deferred benefit; enables all others.
- **Data** = earliest positive cash-flow domain; funds later phases.
- **Finance** = quick-win automation; credibility booster.
- **Optimization insight:** advancing *Data* by one quarter improves enterprise payback by \~2 months.

### 6. Implementation Notes

- `/api/roi/forecast?domain=true` returns both timeline and per-domain ROI arrays.
- Break-even occurs when \(V_{d,t}=C_{d,t}\).
- ROI Dashboard (D051) visualizes domain curves and cumulative value mix.

---

## 9. Total Cost of Change (TCC)

The **Total Cost of Change (TCC)** represents the *complete economic impact* of a transformation — combining direct project costs, operational disruption, integration complexity, and people/process adaptation into a single explainable metric. It extends the ROI and Stage Cost functions to give a holistic view of investment magnitude.

### Formula

$$
TCC = C_{project} + C_{transition} + C_{operational} + C_{human} + C_{risk}
$$

| Symbol             | Description                                                | Example Range        |
| ------------------ | ---------------------------------------------------------- | -------------------- |
| **C\_project**     | Core implementation + license + partner cost               | \$100K–\$5M          |
| **C\_transition**  | Cost to transition data, integrations, and configurations  | 10–30% of C\_project |
| **C\_operational** | Cost of downtime, performance degradation, or dual-running | 5–15% of C\_project  |
| **C\_human**       | Training, enablement, change management overhead           | 10–25% of C\_project |
| **C\_risk**        | Contingency for overruns or scope creep                    | 10–20% of total      |

---

### Derived View: Composition Ratio

$$
TCC_{ratio} = \frac{C_{transition} + C_{operational} + C_{human} + C_{risk}}{C_{project}}
$$

This ratio shows how “heavy” the change effort is beyond the core project budget.

| TCC Ratio | Classification | Description                                 |
| --------- | -------------- | ------------------------------------------- |
| < 0.3     | **Lean**       | Well-contained change; minimal disruption   |
| 0.3–0.6   | **Moderate**   | Some overlap/dual-run complexity            |
| > 0.6     | **Complex**    | Major multi-domain, high-change sensitivity |

---

### Visualization Guidance

In the ROI dashboard and sequencer:

- Represent TCC as a **stacked bar**:
  - Base = `C_project`
  - Segments = transition / operational / human / risk
- Show **TCC Ratio** next to ROI% for interpretability.
- Tooltip displays source formulas and cost breakdown per domain.
- Telemetry event: `tcc_computed` when total cost is finalized per stage or domain.

---

### Example (ERP Modernization)

| Component      | Value (\$)           |
| -------------- | -------------------- |
| C\_project     | 2,000,000            |
| C\_transition  | 400,000              |
| C\_operational | 250,000              |
| C\_human       | 300,000              |
| C\_risk        | 200,000              |
| **TCC**        | **3,150,000**        |
| **TCC Ratio**  | **0.575 (Moderate)** |

---

### Implementation Notes

- Implemented in `/domain/services/roiCalculator.ts` as an extension of `stageCostFunction`.
- Exposed via `/api/roi/forecast` under `tcc_total` and `tcc_ratio`.
- Logged in telemetry with event `tcc_computed`.
- Required for any transformation > \$500K or multi-domain.

---

## 10. Integration Effort and Burden (IBI)

We need an explicit, explainable model for **integration effort**, because in real transformations the integration surface area (adds/changes/retires + dual-run + bridge work) often dominates schedule risk and TCC — even when core system costs are “known.”

### 10.1 Integration Burden Index (IBI)

Define the **IBI** per stage as a weighted sum of integration actions:

$$
IBI_{stage} = w_a A + w_c C + w_r R + w_{dr} DR + w_b B
$$

| Term   | Meaning                                 | How to derive                                          |
| ------ | --------------------------------------- | ------------------------------------------------------ |
| **A**  | # of *new* integrations (net new edges) | graph diff: edges added                                |
| **C**  | # of *changed* integrations             | graph diff: edge type/endpoint/schema changed          |
| **R**  | # of *retired* integrations             | graph diff: edges removed                              |
| **DR** | Dual-run factor (0–N)                   | overlapping old/new edges active concurrently          |
| **B**  | Bridge-work factor (0–N)                | “throwaway” integrations into legacy during transition |

Default weights (tunable per org):

- \(w_a = 1.0\)
- \(w_c = 0.7\)
- \(w_r = 0.4\)
- \(w_{dr} = 1.2\)
- \(w_b = 0.9\)

### 10.2 Integration Cost Function (stage-level)

Map IBI into dollars using an explainable unit cost (per integration “unit”) and a complexity multiplier.

$$
C_{integration,stage} = IBI_{stage} \times C_{int} \times DCF \times RI
$$

| Symbol     | Meaning                        | Default                 |
| ---------- | ------------------------------ | ----------------------- |
| **C\_int** | Base cost per integration unit | \$15K–\$25K             |
| **DCF**    | Domain Complexity Factor       | Finance 1.2x, Data 0.9x |
| **RI**     | Ripple Multiplier              | 1.05–1.10               |

### 10.3 Update Stage Cost Function

Replace the simplistic \((DL_i \times C_{integration})\) term with \(C_{integration,stage}\) when IBI inputs exist.

**Updated:**

$$
C_{stage} = \sum_i [C_{sys_i} + (DRP_i \times LegacyPenalty)] + C_{integration,stage}
$$

This preserves backwards compatibility: if the stage doesn’t have IBI components populated, fall back to DL-based cost.

### 10.4 Update TCC Composition

Treat integration burden as a primary contributor to **C\_transition**.

$$
C_{transition} = C_{integration,stage} + C_{data\_migration} + C_{config\_migration}
$$

If you only have integration info early, you can still compute a meaningful partial-TCC with provenance.

### 10.5 Provenance and Explainability

Every stage must persist:

- \(A, C, R, DR, B\) and the graph diff references used to count them
- weights \(w_*\) and applied multipliers (DCF, RI)
- final \(IBI_{stage}\) and \(C_{integration,stage}\)

**API guidance:** `/api/roi/forecast` returns:

- `integration_burden`: { A, C, R, DR, B, IBI, C\_integration\_stage }
- `source_formula`: rendered string + key inputs

**Telemetry:**

- Emit `integration_burden_computed` when IBI is calculated
- Emit `integration_burden_spike` when \(IBI_{stage}\) exceeds threshold (e.g., > 20 units)

### 10.6 Sequencer Stage JSON shape

Add an optional block to each stage payload:

```json
{
  "integration_burden": {
    "adds": 12,
    "changes": 8,
    "retires": 3,
    "dual_run": 1,
    "bridge": 4,
    "weights": {"wa": 1.0, "wc": 0.7, "wr": 0.4, "wdr": 1.2, "wb": 0.9},
    "unit_cost": 20000,
    "domain_complexity_factor": 1.1,
    "ripple_multiplier": 1.05
  }
}
```

This enables:

- more accurate cost curves (TCC)
- explainable integration risk
- scenario comparison (same core system cost, different integration burden)

---

## 11. Notes for Scenario Authoring (Manual / No Transcript World)

When transcripts are unavailable, scenario creators still need an easy way to specify integration burden and coupling risk.

**Two lightweight inputs (human-friendly):**

1. **Integration scope**: “add 10, change 6, retire 2” (or “low/med/high”)
2. **Dual-run + bridge**: “dual-run for 2 phases” / “bridge into EBS for pricing”

ALE can infer the rest:

- map “bridge into EBS” → \(B\) increases
- map “dual-run 2 phases” → \(DR\) increases
- map “lots of new interfaces” → \(A\) increases

This keeps authoring simple while preserving provenance.

