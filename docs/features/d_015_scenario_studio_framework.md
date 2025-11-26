## Directive D015: Scenario Studio Framework ("Enterprise Trading Desk")

### Purpose
Transform Fuxi EA into an interactive simulation engine where business and technology decisions are treated as tradable assets in a live portfolio. Scenario Studio enables users to model, compare, and forecast the impact of strategic, financial, and architectural decisions in real-time.

---

### Core Concept
Scenario Studio bridges enterprise architecture and financial intelligence. Each **capability**, **system**, or **initiative** is modeled as a portfolio asset with risk, cost, and return characteristics. Scenarios simulate alternative configurations over time, visualized as dynamic charts and dashboards.

**Metaphor:** Think of the enterprise as a trading floor — every change (modernization, retirement, investment) shifts the risk/reward profile of the organization's technology portfolio.

---

### Core Components

1. **Scenario Engine**
   - Consumes normalized data from D010 schema (capabilities, costs, dependencies, maturity).
   - Generates baseline and alternative states based on variable adjustments.
   - Calculates deltas: `ROI`, `Time-to-Value`, `Risk Exposure`, `Strategic Alignment`.

2. **Financial Model Layer**
   - Converts maturity and readiness scores into financial equivalents:
     - **Maturity → Efficiency Yield**
     - **Opportunity → Upside Potential**
     - **TechFit → Risk Volatility**
     - **Cost Inputs → Capital Allocation**
   - Enables the slider-based time simulation to model changes in these factors over time.

3. **Visualization Layer (Candlestick View)**
   - **X-axis:** Time horizon (quarters/years)
   - **Y-axis:** Portfolio value (ROI or strategic score)
   - **Candlestick Body:** Range between best-case and worst-case outcomes
   - **Overlays:** Cost delta line, risk gradient shading, and domain color coding
   - Optional secondary chart: risk distribution histogram (volatility per domain)

4. **Scenario Types**
   - **Baseline:** Current-state portfolio.
   - **Transformation:** Simulates modernization, AI adoption, or decommissioning.
   - **Budget Optimization:** Shifts allocation between domains.
   - **Workforce Mix:** Adjusts consultant vs FTE ratios.
   - **Time Compression:** Projects impacts of accelerated vs delayed timelines.

5. **AI Trader Copilot**
   - Explains why Scenario B outperforms Scenario A.
   - Surfaces high-impact levers automatically ("Reducing OPEX in Domain X by 12% yields +7% ROI").
   - Offers recommended next trades ("Reinvest savings in underperforming capability cluster").

---

### Inputs & Dependencies
| Source | Description | Data Path | Dependency |
|---------|--------------|------------|-------------|
| D010 Schema | Validated master dataset | `/data/validated/master.json` | Required |
| Capability Scores | Maturity, readiness, opportunity | `.fuxi/data/capabilities.json` | Required |
| Cost Models | OPEX/CAPEX + consultant spend | `.fuxi/data/financials.json` | Required |
| Performance Metrics | AI outputs, uptime, risk | `/api/metrics` | Optional |
| Scenario Templates | Preset configuration files | `/config/scenarios/*.json` | Optional |

---

### UI & Interaction Model
1. **Dashboard Layout:**
   - Left Panel: Scenario Selector + Inputs (sliders, toggles, weight adjustments)
   - Center Panel: Candlestick/Heatmap visualization
   - Right Panel: AI Copilot explanations + deltas summary
2. **Scenario Slider:** Simulates timeline evolution (e.g., Q1 → Q4 → Y+3)
3. **Comparison Mode:** Overlay or side-by-side scenario views.
4. **Financial Lens Toggle:** Switch between technical KPIs and financial equivalents (ROI, NPV, risk exposure).

---

### Formulas & Modeling Logic

**1. ROI (Return on Investment)**  
```
ROI = ((Value_Post - Value_Pre) - (Cost_Post - Cost_Pre)) / (Cost_Post - Cost_Pre)
```
Where:
- `Value_Pre` = current efficiency yield × maturity
- `Value_Post` = projected efficiency yield × maturity + opportunity uplift
- `Cost_Post` and `Cost_Pre` = CAPEX + OPEX totals per capability or domain.

**2. Risk Exposure**  
```
Risk_Exposure = (1 - TechFit) × (Dependency_Factor + Volatility_Factor)
```
- `TechFit` = normalized (0–1) fit score from schema.
- `Dependency_Factor` = (# upstream + downstream dependencies) ÷ total capabilities.
- `Volatility_Factor` = variance in cost and performance over time.

**3. Strategic Alignment Score**  
```
Strategic_Alignment = (Weighted_Maturity + Opportunity × 0.5 + PeopleReadiness × 0.25)
```
Used for heatmap overlays and AI-driven prioritization.

**4. Time-to-Value (TTV)**  
```
TTV = (Implementation_Time / Efficiency_Gain) × Adjustment_Factor
```
- `Adjustment_Factor` derived from project risk and dependency density.

**5. Volatility Index (per domain)**  
```
Volatility = StdDev(Quarterly_Costs) / Mean(Quarterly_Costs)
```
Used to visualize financial instability in the candlestick variance.

---

### 📈 Appendix A — Visual Metaphors for Decision Intelligence ("The Hammer Demo")

**Purpose:**  
Translate architectural portfolio behavior into recognizable financial chart metaphors to help non-technical stakeholders intuitively understand strategic risk and value movement.

**Included Patterns:**
| Pattern | Visual Behavior | Enterprise Interpretation | Example Use |
|----------|-----------------|---------------------------|--------------|
| **Hammer 🛠️** | Small body, long lower wick | Sharp dip followed by recovery → “temporary delivery risk” | New vendor adoption stabilizing post-launch |
| **Inverted Hammer 🔨** | Small body, long upper wick | Unrealized upside → “high potential with slow execution” | AI project overestimated ROI |
| **Doji ⚖️** | Thin or no body | Equilibrium → “stalled transformation or uncertain strategy” | Competing initiatives in budget hold |
| **Bullish Engulfing 📈** | Large positive swing | Strong business case → “modernization gains traction” | Consolidation of duplicated systems |
| **Bearish Engulfing 📉** | Large negative swing | Strategic setback → “project cost or delivery failure” | Overrun or capability retirement impact |

**Usage:**  
- Display pattern recognition overlays on candlestick visualization.  
- AI Copilot narrates:  
  > “This quarter resembles an inverted hammer in your Digital Experience domain — potential upside is blocked by staffing constraints.”  
- Supports storytelling in executive readouts and scenario comparisons.

**Lock State:**  
🔒 *Reference Only* — excluded from build pipeline until directive D015.1 “Visual Storytelling Layer” is approved.

**Note:**  
_Approved for executive visualization demos only — not production use until stakeholder training complete._

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Data Integrity | Scenarios reference valid schema inputs (from D010) | ☐ | Fuxi |  |
| ROI Calculation Accuracy | Outputs match defined formulas | ☐ | Codex |  |
| Visualization Clarity | Candlestick and overlays render correctly | ☐ | Mesh |  |
| Scenario Switching | Baseline ↔ Alternative toggles persist state | ☐ | Codex |  |
| AI Explanations | Outputs align with delta computations | ☐ | Fuxi |  |
| Performance | Render <200ms on 1k capability inputs | ☐ | Mesh |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-25  
- **Type:** Simulation & Visualization Directive  
- **Priority:** Critical  
- **Feature Branch:** `feat/d015_scenario_studio_framework`  
- **Auth Mode:** Disabled (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Integrate simulation layer with validated data schema (D010) and deploy visualization prototype in Next.js + Recharts (open-source).

