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
B = (0.10 \times 3M) + (0.25 \times 12) = 300,000 + 3 = 303,000
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

| Month  | Cumulative Cost | Cumulative Benefit | Net         |
| ------ | --------------- | ------------------ | ----------- |
| 0      | \$200K          | \$50K              | -150K       |
| 3      | \$950K          | \$370K             | -580K       |
| 6      | \$2.2M          | \$1.19M            | -1.01M      |
| 9      | \$3.9M          | \$3.05M            | -850K       |
| **11** | **\$4.8M**      | **\$4.95M**        | **+150K** ✅ |

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
- Placeholder fields in `financials.json` should map 1:1 to variables above.
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

### Visualization Guidance

In the ROI dashboard and sequencer:

- Represent TCC as a **stacked bar**:
  - Base = `C_project`
  - Segments = transition / operational / human / risk
- Show **TCC Ratio** next to ROI% for interpretability.
- Tooltip displays source formulas and cost breakdown per domain.
- Telemetry event: `tcc_computed` when total cost is finalized per stage or domain.

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

### Implementation Notes

- Implemented in `/domain/services/roiCalculator.ts` as an extension of `stageCostFunction`.
- Exposed via `/api/roi/forecast` under `tcc_total` and `tcc_ratio`.
- Logged in telemetry with event `tcc_computed`.
- Required for any transformation > \$500K or multi-domain.

---

## Appendix A — Reference Implementation (TypeScript)

The following matches the current implementation shape you shared from `// src/domain/services/roiCalculator.ts`.

```ts
// src/domain/services/roiCalculator.ts

/**
 * Interface representing inputs for Total Cost of Change (TCC) calculation
 */
export interface TCCInputs {
  systemId: string;
  baseStageCost: number; // Derived from harmonization (C_stage)
  integrationCount: number; // DL_i
  integrationCost: number; // C_integration
  dualRunPenalty?: number; // LegacyPenalty, optional multiplier
  resourceHeadcount: number; // HR_i
  hourlyRate: number; // R_i
  durationHours: number; // D_i
  operationalImpactPercent?: number; // as % of domain revenue
  domainRevenue?: number; // revenue baseline for ops calc
  riskFactor?: number; // 0–1 scale for project risk
  governancePercent?: number; // org baseline, default 0.1
}

/**
 * Interface representing TCC calculation results
 */
export interface TCCResult {
  total: number;
  stageCost: number;
  resources: number;
  operational: number;
  risk: number;
  governance: number;
}

/**
 * Calculates the Total Cost of Change (TCC) for a given system or domain stage.
 * Implements math_explainers_tcc.md logic.
 */
export function totalCostOfChange(input: TCCInputs): TCCResult {
  const {
    baseStageCost,
    integrationCount,
    integrationCost,
    dualRunPenalty = 0,
    resourceHeadcount,
    hourlyRate,
    durationHours,
    operationalImpactPercent = 0,
    domainRevenue = 0,
    riskFactor = 0.1,
    governancePercent = 0.08,
  } = input;

  // Stage cost: system base + integration + dual-run
  const stageCost =
    baseStageCost +
    integrationCount * integrationCost +
    dualRunPenalty * baseStageCost;

  // Resource cost: HR × rate × duration
  const resources = resourceHeadcount * hourlyRate * durationHours;

  // Operational impact cost: % of domain revenue
  const operational = (operationalImpactPercent / 100) * domainRevenue;

  // Risk and governance overlays
  const risk = riskFactor * (stageCost + resources);
  const governance = governancePercent * (stageCost + resources);

  const total = stageCost + resources + operational + risk + governance;

  return {
    total,
    stageCost,
    resources,
    operational,
    risk,
    governance,
  };
}
```

