## Directive D016: Portfolio Simulation Dataset (Deckers Provenance)

### Purpose
Establish the **Deckers Current/Future Inventory Dataset** as the canonical real-world test case for Fuxi EA's Scenario Studio (D015). This dataset serves as both a validation bed and a live simulation source for ROI, volatility, and dependency modeling across the current vs. future enterprise landscape.

**Status:** ✅ Completed

---

### Provenance
This dataset originated from two interpreted architectural diagrams (Current State vs. Future State) created during early Fuxi EA development sessions. The resulting spreadsheet formalized those visuals into structured data, representing the first practical implementation of the D010 Schema model.

- **Origin:** User-provided architectural diagrams → AI interpretation → structured inventory model (Deckers)
- **File:** `/docs/data/Deckers_CurFut_Inventory_Diff_v2.xlsx`
- **Created:** November 2025
- **Format:** Excel (two sheets: `Current_State_Apps` and `Future_State_Apps`)
- **Type:** Real-world enterprise system portfolio (validated for scenario simulation)
- **Purpose:** Baseline and comparison inputs for Scenario Studio ROI and dependency forecasting.

---

### Dataset Overview
| Sheet | Description | Key Fields | Schema Link (D010) |
|--------|--------------|-------------|--------------------|
| `Current_State_Apps` | Existing systems and integrations | `Raw_Label`, `Logical_Name`, `Layer`, `Domain`, `System_Type`, `Dependencies_Upstream`, `Dependencies_Downstream`, `Disposition_Color` | Maps to `type`, `domain`, `dependencies`, `metadata.source` |
| `Future_State_Apps` | Target systems post-modernization | `Raw_Label`, `Logical_Name`, `Layer`, `Domain`, `System_Type`, `Dependencies_Upstream`, `Dependencies_Downstream`, `Disposition_Color` | Maps to `type`, `domain`, `dependencies`, `scores.opportunity` |

Additional metadata columns (e.g., `Notes`, `Interpretation`, `Disposition_Color`) serve as qualitative indicators of transition states and risk.

---

### Simulation Readiness Mapping
| Column | Simulation Role | D015 Formula Input |
|---------|------------------|--------------------|
| `Disposition_Color` | State type: existing (black) or new (green) | ROI delta calculation (baseline vs. new asset) |
| `Layer` | System layer (capability, integration, presentation) | Used for dependency factor weighting |
| `Domain` | Business grouping | Volatility aggregation per domain |
| `Dependencies_Upstream` / `Dependencies_Downstream` | Relationship graph | Risk exposure computation (dependency density) |
| `System_Type` | SaaS / Custom / Hosted | TechFit normalization |
| `Notes` | Qualitative risk or commentary | Input for AI Copilot narrative |

---

### Testing Protocol (Codex)
**Objective:** Validate and operationalize the Deckers dataset through Scenario Studio’s computational model.

**Steps:**
1. Ingest both sheets via `/api/import/excel` → convert to validated JSON (schema: D010).
2. Confirm dependency resolution between systems (`id` link validation).
3. Calculate portfolio diffs: identify `Disposition_Color` deltas → derive ROI baseline.
4. Compute volatility index (D015 Formula 5) using cost/time proxies if available.
5. Render comparison in Scenario Studio’s candlestick visualization.
6. Validate AI Copilot’s narrative consistency (matches formulaic ROI output).
7. Export `validationReport.json` + `scenario_delta_report.json` to `/reports/tests/d016/`.

---

### Expected Outputs
- **Portfolio ROI Chart:** visualizing system-level and domain-level investment deltas.
- **Volatility Heatmap:** indicating capability stability across modernization trajectory.
- **Dependency Graph:** ReactFlow visualization of upstream/downstream integration effects.
- **AI Copilot Narrative:** contextual summary of performance, cost, and risk delta.

---

### 🧭 Executive Traceability Layer – Locked

**Purpose:** Provide an end-to-end, auditable pipeline view of how real enterprise data flows through Fuxi EA’s simulation ecosystem — ensuring transparency, reproducibility, and accountability.

#### Data-to-Simulation Pipeline Diagram

**1. Source (Raw Data)**  
- Input: `Deckers_CurFut_Inventory_Diff_v2.xlsx`  
- Sheets: `Current_State_Apps`, `Future_State_Apps`  
- Action: Ingested via `/api/import/excel`  
- Output: Raw JSON → `/data/imported/deckers_raw.json`

**2. Validation Layer (D010)**  
- Tool: Schema verification (Zod-based)  
- Checks: Field conformance, dependency integrity, null handling  
- Output: Validated dataset → `/data/validated/master.json`  
- Artifact: `validationReport.json`

**3. Simulation Engine (D015)**  
- Inputs: Validated data + cost/time estimates  
- Process: ROI, Risk Exposure, Strategic Alignment, Volatility modeling  
- Output: Scenario deltas → `/reports/tests/d016/scenario_delta_report.json`  
- Visuals: Candlestick chart, Volatility heatmap, Dependency graph

**4. AI Interpretation Layer**  
- Agent: Fuxi (Architectural Reasoner)  
- Function: Generate natural-language narratives explaining portfolio behavior  
- Output: `ai_narrative_summary.md`

**5. Executive Visualization (UI)**  
- Platform: Scenario Studio (Next.js + Recharts + ReactFlow)  
- Views: ROI chart, heatmap, risk distribution, dependency map  
- Overlay: AI Copilot commentary on scenario deltas

**6. Verification & Governance**  
- Validation: D016 Verification Table  
- Governance: Versioned result archives → `/reports/history/`  
- Outcome: Auditable, defensible business case pipeline

**Lock State:**  
🔒 *Reference Only* — May not be modified or overwritten without authorization from EA Mesh governance. Codex can render or visualize but not alter this flow.

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Data Integrity | No missing `id` or `domain` fields in import | ☐ | Fuxi |  |
| Schema Compliance | Validates against D010 standard | ☐ | Mesh |  |
| Dependency Accuracy | Upstream/downstream links resolve correctly | ☐ | Codex |  |
| ROI Formula Validation | ROI matches Scenario Studio output (D015) | ☐ | Codex |  |
| Visualization Accuracy | Candlestick reflects correct domain rollups | ☐ | Mesh |  |
| AI Narrative Alignment | Copilot explanations consistent with metrics | ☐ | Fuxi |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-25  
- **Type:** Dataset & Simulation Directive  
- **Priority:** Critical  
- **Feature Branch:** `feat/d016_portfolio_simulation_dataset`  
- **Auth Mode:** Disabled (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Integrate as test dataset for D015 Scenario Studio simulation and validate all ROI/risk formulas against real enterprise data.
