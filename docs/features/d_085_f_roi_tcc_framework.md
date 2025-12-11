## 🧭 Directive D085F — ROI/TCC Input Framework

### 🎯 Objective
Define the structured **input framework** required to compute and reason about **ROI (Return on Investment)** and **TCC (Total Cost of Change)** across transformation programs.  
This framework ensures that Fuxi can model transformation impact even when datasets are incomplete, enabling both real and estimated insights.

---

### 🧩 Framework Overview

The framework divides required inputs into **six key categories**, each with estimation logic and ALE-derived extensions for adaptability.

---

### 1️⃣ Foundational Context
| Input | Description | Example | Estimation Strategy |
|-------|--------------|----------|---------------------|
| **Portfolio of Active Systems** | Inventory of current-state systems. | EBS, MFCS, DOMS, SFCC | Already captured in graph/Datadog exports |
| **Strategic Drivers** | Transformation purpose and goals. | Simplification, scalability | Derived from leadership briefings |
| **Transformation Phases** | Planned rollout structure. | FY26–FY28 by domain | Extracted from Sequencer data |

---

### 2️⃣ Cost Components (TCC)
| Category | Description | Example | Estimation Strategy |
|-----------|--------------|----------|---------------------|
| **System Replacement Cost** | Implementation & licensing. | SAP S/4 rollout = $4.5M | Use enterprise benchmark or T-shirt sizing |
| **Integration Rework Cost** | Integration volume × avg. cost. | 200 × $15k | Derived from graph node count |
| **Training & Change Management** | Reskilling cost per impacted user. | 500 × $1.5k | Estimated from user manifest (D076) |
| **Operational Disruption** | Productivity impact. | 3-month 10% slowdown | Modeled via Sequencer temporal data |
| **Decommissioning Cost** | Retirement of legacy systems. | EBS shutdown = $800k | Calculated by dependency scope |

---

### 3️⃣ ROI Components
| Category | Description | Example | Estimation Strategy |
|-----------|--------------|----------|---------------------|
| **Efficiency Gains** | Cycle time & process automation. | -30% order-to-cash | Use benchmark multipliers |
| **Cost Avoidance** | Eliminating maintenance/licensing costs. | $1.2M/yr | Pulled from ops/finance data |
| **Scalability Value** | Increased throughput or capacity. | +40% peak volume | Modeled as revenue delta |
| **Risk Mitigation Value** | Reduced downtime/failure rates. | -30% incidents | From Datadog telemetry |
| **Innovation Enablement** | New strategic capabilities. | API-ready platform | Rated via strategic alignment index |

---

### 4️⃣ Sequencing & Interdependency Data
| Input | Description | Example | Estimation Strategy |
|--------|--------------|----------|---------------------|
| **Integration Topology** | System interconnectivity map. | EBS → MFCS → OMS | Captured in graph nodes |
| **Dependency Strength** | Coupling intensity. | OMS-MFCS = high | ALE reasoning inference |
| **Change Velocity** | Organizational speed of change. | 2 major rollouts/year | Historical cadence data |
| **Regional Sequencing** | Geographic rollout pattern. | Canada → US → EMEA | Extracted from transcripts |

---

### 5️⃣ Human & Organizational Inputs
| Input | Description | Example | Estimation Strategy |
|--------|--------------|----------|---------------------|
| **Team Capacity** | Available skill bandwidth. | 12 OMS engineers | From org chart data |
| **Decision Latency** | Approval and governance delay. | 4 weeks | Derived from workflow metrics |
| **Stakeholder Alignment** | Leadership consensus index. | Ralph 85%, Siva 35% | From transcript analysis |
| **Cultural Change Index** | Adaptability to transformation. | Medium-Low | Inferred from historical data |

---

### 6️⃣ ALE-Derived Fields
| Field | Source | Purpose |
|--------|---------|----------|
| **Confidence Weight** | Integration telemetry & volatility | Guides sequencing predictions |
| **ROI/TCC Ratio** | Derived metric | Prioritization filter in Decision Backlog |
| **Readiness Index** | Tech + human factor fusion | Org Intelligence indicator |
| **Provenance Trace** | Data lineage tracking | Ensures explainability & auditability |

---

### 7️⃣ Optional Enhancements (for Demo)
If data is incomplete, use fallback mechanisms:
- **T-shirt sizing:** $$, $$$, $$$$ tiers for cost approximations.
- **Confidence sliders:** Manual override for missing precision.
- **Benchmark overlays:** Auto-fill from similar enterprise patterns.

---

### ✅ Completion Criteria
- Field structure defined and documented in ALE schema.
- Inputs connected to Sequencer and ROI/TCC overlay in Graph view.
- ALE generates ROI/TCC ratio and Readiness Index automatically.
- Provenance tracking activated for all estimated fields.

---

**Branch:** `feature/d085f_roi-tcc-framework`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D084C (Graph), D085A (Sequencer), D085E (Transformation Lens)  
**Next:** D086B — *ROI/TCC Visualization in Scenario Views*

