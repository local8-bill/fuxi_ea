# 🧩 **Directive D085G — OMS Transformation Population & Modeling Pass (with ROI/TCC Integration)**

### 🎯 **Objective**

Expand the Deckers OMS transformation model to fully integrate **ROI (Return on Investment)** and **TCC (Total Cost of Change)** analytics directly within Fuxi’s Experience Shell. This version connects technical transition data (systems, sequencing, and dependencies) with business metrics, making ROI and TCC dynamically computable per phase, region, or scenario.

---

## 🧭 **Fuxi: OMS Transformation Preview with ROI/TCC Intelligence**

### **Phase 1 — Current State**

**What Fuxi Shows**  
Visual depiction of Deckers’ *as-is* enterprise architecture:  
- Oracle EBS, DOMS, RMS, SIM, integrations, and order flows.  
- Integration complexity heat map.  
- Cost of ownership breakdown.

**What We Need From Deckers**
- Full system inventory (core + peripheral systems)  
- Integration map or dependency matrix  
- Baseline operational costs and pain points

**What Deckers Gets**
- System and integration count visualized by domain  
- Baseline “Cost of Today” — technical + operational effort  
- Foundation for ROI and TCC projection baselines

> **Outcome:** Quantified complexity and cost awareness — the foundation for transformation economics.

---

### **Phase 2 — Transitional State**

**What Fuxi Shows**  
Two transition paths modeled dynamically:
1. **Direct Integration Path** — OMS ↔ EBS.  
2. **MFCS-First Path** — OMS ↔ MFCS ↔ EBS.  

Each path renders:
- Parallel vs. serial sequencing per region  
- Coupling density and throw-away work  
- Real-time TCC projection and confidence rating

**What We Need From Deckers**
- OMS and MFCS target vendor data  
- Rollout strategy (region, brand, or channel first)  
- Financial assumptions (integration cost, deprecation cost, savings horizon)

**What Deckers Gets**
- Interactive TCC visualization per path  
- “Cost of Transition” compared side-by-side  
- Automatic ROI deltas for short- and mid-term options

> **Outcome:** Data-driven trade-offs between integration strategies with live TCC calculation.

---

### **Phase 3 — Future State**

**What Fuxi Shows**  
A harmonized architecture model featuring:
- Unified OMS and MFCS peers (decoupled from EBS)  
- Centralized inventory visibility  
- Shared data fabric across commerce and retail channels

**What We Need From Deckers**
- Target KPIs (ROI, margin, operational efficiency, tech debt reduction)  
- Post-modernization operating cost estimates  
- Time-to-value expectations by region/brand

**What Deckers Gets**
- ROI and TCC curves across three fiscal years (FY26–FY28)  
- ROI delta heat map per region  
- TCC breakdown by system and dependency  
- Exportable cost/benefit summary (JSON/CSV)

> **Outcome:** Economic clarity for transformation investments, continuously updated as data matures.

---

## ⚙️ **How Fuxi Models ROI and TCC**

**1. Data Sources**
- `graph_live.json` → Node coupling and dependency density.
- `/api/digital-enterprise/view` → Harmonized integration graph.
- Financial inputs from user form or scenario upload → Cost per system, integration, and phase.

**2. Calculations**
- **TCC** = (Integration Effort + Tech Debt + Transition Cost) – (System Reduction Savings)
- **ROI** = (Operational Gains + Efficiency Savings) / (Total Transformation Cost)

**3. Outputs (in Graph View)**
- Right-rail summary: “Cost Today,” “Transition Cost,” “Value Tomorrow.”  
- Hover tooltips: Cost per system, ROI per integration.  
- ALE hooks: Predictive sequencing based on best ROI/TCC balance.

---

## 📊 **User Interactions**

- **/feedback roi** — capture user insight on ROI assumptions.
- **/scenario compare** — run alternate OMS sequencing for different regions.
- **/tcc view** — visualize full Total Cost of Change per system and phase.

---

## 🧩 **Next Actions (Internal)**

- dx: Connect ROI/TCC calculation hooks inside `/components/graph/RightRailSummary.tsx`.
- Integrate ALE predictive learning from directive D084D.
- Add live financial input panel in ExperienceShell (right-rail widget).
- Publish results under `/project/700am/experience?scene=digital&view=oms`.

---

**Branch:** `feature/d085g_oms_population_modeling_roi_tcc`  
**Approvers:** Agent Z (Bill), Fuxi Core  
**Deliverable:** Fully integrated OMS Demonstration Graph (Phases 1–3, ROI/TCC Intelligence Enabled)

