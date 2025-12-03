## D051: ROI Dashboard (Hypothesis View)

### Objective
Create the first interactive, explainable version of the ROI Dashboard that enables users to estimate transformation value using the **hypothesis model** (t-shirt sizing and relative impacts). This version will simulate financial outcomes before connecting to live data.

---

### Core Goals
1. **Demonstrate value early** — show ROI, cost, and payback visually with minimal inputs.
2. **Enable scenario testing** — users can tweak assumptions (size, complexity, overlap, time) and instantly see updated results.
3. **Build trust** — every number and chart links back to its formula and source per the Explainability Mandate.

---

### Components

#### 1. Input Panel (Hypothesis Setup)
Interactive sidebar where users define transformation parameters:
- **Transformation Scope** — dropdown for major domains or systems (ERP, CRM, Data, etc.)
- **Complexity / Size Selector** — S, M, L, XL (maps to cost range)
- **Dual Run Toggle** — yes/no adds LegacyPenalty
- **Dependency Level Slider** — 0–10 scale for upstream/downstream connections
- **Timeline Duration** — in months or quarters

> Output: Generates `stageCost` and `stageBenefit` JSON objects based on selections.

---

#### 2. ROI & Payback Visualization Panel
Core chart area displaying:
- **Cumulative Cost vs Benefit Curve** (area chart)
- **ROI% Line Overlay** (secondary axis)
- **Break-even Marker** at intersection

Telemetry events:
- `roi_model_generated` — user hits “Calculate”
- `roi_break_even_reached` — plotted intersection event

---

#### 3. Output Summary Pane
Compact summary card set:
| Metric | Description | Example |
|---------|--------------|----------|
| **Total Cost** | Sum of all stage costs | $4.8M |
| **Total Benefit** | Sum of all realized gains | $4.95M |
| **Break-even Month** | First positive ROI | Month 11 |
| **ROI at 12M** | Final ROI% at Year 1 | +3% |
| **Confidence** | Confidence score from input completeness | 0.76 |

---

### Visual Design Notes
- **Color palette:** Red (Cost), Green (Benefit), Gold (Break-even), Blue (ROI%)
- **Interactions:** Hover for per-stage breakdowns; tooltips include formula source.
- **Animation:** Smooth curve transitions when inputs change.
- **Layout:** Grid split — left input, right chart, bottom summary cards.

---

### Data & Logic Integration
- Pull formula logic directly from `/domain/services/roiCalculator.ts`.
- Use `financials.json` (if present) to seed default values.
- All calculated outputs logged to `/api/telemetry` for ROI tracking.

---

### Acceptance Criteria (HAT/UAT)
- User can select 3+ transformation configurations and compare outputs.
- Charts animate and reflect real-time formula updates.
- Tooltip shows formula source (`display_value` + `source_formula`).
- Telemetry events emit for calculate, stage change, and break-even.
- Break-even and ROI% outputs match the logic from the explainer document.

---

### Future Extension (D052)
In Phase 2, this dashboard will transition from *hypothesis mode* to *data-backed mode*:
- Pull harmonized data from current/future CSVs.
- Integrate per-domain financial metrics from real `financials.json`.
- Add CFO-mode with drilldowns per system and integration.

---

**Deliverable:** ROI Dashboard Hypothesis Mode — working page under `/project/[id]/roi-dashboard` that demonstrates transformation economics and cost/benefit math interactively, with explainable AI annotations.

