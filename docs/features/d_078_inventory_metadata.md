## 🧭 Directive D078 – Application Inventory Metadata Enrichment

### Objective
Enhance the Fuxi_EA Application Inventory schema to include **platform classification metadata** that enables dynamic risk weighting, sequencing logic, and ROI attribution within the Adaptive Learning Engine (ALE-Lite) and the broader Digital Twin.

---

### Background
Current inventory items track system name, domain, region, and integrations, but lack strategic context.  
By embedding **platform classification intelligence**, Fuxi can reason about *why* systems exist — not just *where* they connect.  

This bridges architecture with business strategy, aligning digital transformation planning to measurable outcomes.

---

### Schema Enhancements

**File:** `/data/inventory/schema/app_inventory_v2.json`

```json
{
  "application_id": "salesforce_core",
  "name": "Salesforce Sales Cloud",
  "domain": "Customer Experience",
  "region": "Global",
  "category": "CRM",
  "classification": "Global Strategic Platform",
  "owner": "CX Technology",
  "dependencies": ["sap_s4hana", "data_hub"],
  "interfaces": 92,
  "status": "Active",
  "risk_weight": 0.88,
  "maturity_stage": "Wave 1 - Foundation",
  "telemetry_tags": ["crm", "customer", "strategic"]
}
```

---

### Classification Definitions

| **Classification** | **Definition** | **Example Systems** | **Transformation Priority** | **ALE Weighting (risk)** |
|---------------------|----------------|----------------------|------------------------------|---------------------------|
| **Global Strategic Platform** | Core enterprise backbone that supports multiple domains and strategic value creation. | SAP S/4HANA, Salesforce, Workday | Anchor in Wave 1 | 1.0 |
| **Standard Platform** | Domain-level platform or regionally bound application that supports standardized operations. | Adobe Experience Manager, ServiceNow, Regional Data Hubs | Modernize in Wave 2 | 0.7 |
| **Competitive Advantage Platform** | Differentiated, customer- or market-facing system that drives innovation. | BigCommerce, Recommendation AI, Custom CX Portal | Innovate in Wave 3 | 0.5 |

---

### Integration with ALE-Lite

**1️⃣ Risk Weighting**
```ts
const riskModifier = {
  "Global Strategic Platform": 1.0,
  "Standard Platform": 0.7,
  "Competitive Advantage Platform": 0.5
};
```
Applies a multiplier to ALE-Lite’s base risk score per classification.

**2️⃣ Sequencer Logic**
- **Global Strategic** → Wave 1: stabilize foundations.  
- **Standard** → Wave 2: harmonize operations.  
- **Competitive Advantage** → Wave 3: innovate and differentiate.

**3️⃣ ROI Attribution**
- **Global Strategic:** cost reduction & resilience  
- **Standard:** efficiency & compliance  
- **Competitive:** growth & market differentiation  

**4️⃣ Telemetry Tagging**
Each application emits events with `classification`, enabling analytics of change effort distribution by platform tier.

---

### Telemetry Example

```json
{
  "event": "learning_metrics_generated",
  "application_id": "commerce_engine",
  "classification": "Competitive Advantage Platform",
  "risk": 0.64,
  "confidence": 0.81,
  "velocity": 0.75,
  "maturity": 0.72,
  "timestamp": "2025-12-08T22:15Z"
}
```

---

### Deliverables
- Updated JSON schema in `/data/inventory/schema/app_inventory_v2.json`
- ALE-Lite risk modifier integration in `/lib/learning/scoring.ts`
- Sequencer weighting logic update
- ROI dashboard update to segment results by classification
- Telemetry enrichment for all ALE events

---

### ✅ Implementation Snapshot (Codex)

- **Schema + Loader:** `data/inventory/schema/app_inventory_v2.json` defines platform classifications. Runtime loader lives in `src/lib/inventory/classification.ts`, exposing `getClassificationMix`, `getRiskModifier`, `deriveWaveTarget`, and the `/api/inventory/classifications` endpoint.
- **ALE Integration:** `loadGraphContext` now fetches classification mix and injects both risk modifiers and derived wave targets into `scoreLearning`. Learning records append `classification_mix`, and `ale_lite.metrics_updated` telemetry includes the same context.
- **ROI Segmentation:** `ROIClassificationBreakdown` component (consuming `useClassificationMix`) renders the platform mix under the ROI scene, giving finance a quick view of strategic vs. competitive focus.
- **Telemetry Hooks:** ROI forecasts emit `roi_forecast_viewed`, onboarding logs `onboarding_intent_updated`, ensuring ALE Lite reacts even outside Sequencer flows.

---

### Governance
- **Branch:** `feature/d078_inventory_metadata`
- **Commit:** `feat(inventory): enrich application metadata with classification schema`
- **Approvers:** Agent Z (Bill) & Fuxi
- **Dependencies:** D077C-L (ALE-Lite Integration)
- **Output:** Data-driven prioritization of transformation waves and risk attribution by platform type.
