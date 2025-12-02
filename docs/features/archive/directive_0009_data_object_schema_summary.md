## Directive 0009: Fuxi EA Data Object Schema Summary

### Purpose
Define the **data object schema** that underpins the Fuxi EA platform. This directive ensures that all analytical, visualization, and simulation components (D003–D007) share a unified structure and vocabulary. The schema serves as both a technical and cognitive model—enabling consistency for developers, agents, and users alike.

**Status:** ✅ Completed

---

### 1. Core Entities & Relationships

#### **System**
Represents an application, service, or platform in the enterprise ecosystem.
```json
{
  "id": "SYS001",
  "name": "Salesforce",
  "domainId": "DOM001",
  "vendor": "Salesforce Inc.",
  "category": "CRM",
  "status": "active",
  "disposition": "modernize",
  "owner": "Marketing",
  "cost": 120000,
  "roiScore": 78,
  "aiOpportunityScore": 65,
  "integrations": ["INT001", "INT002"],
  "tags": ["SaaS", "Customer Data"]
}
```
**Relationships:**  
- belongs to → `Domain`  
- has many → `Integrations`  
- is referenced by → `ROIResult`, `AIInsight`

---

#### **Integration**
Represents a connection or dependency between two systems.
```json
{
  "id": "INT001",
  "sourceSystemId": "SYS001",
  "targetSystemId": "SYS002",
  "type": "API",
  "frequency": "daily",
  "dataVolume": "500MB",
  "criticality": "high",
  "status": "active"
}
```
**Relationships:**  
- belongs to two → `System`

---

#### **Domain**
Business area that groups related systems.
```json
{
  "id": "DOM001",
  "name": "Sales & Marketing",
  "description": "All customer and campaign systems",
  "color": "#4f46e5"
}
```
**Relationships:**  
- has many → `System`

---

#### **Capability**
Represents functional capabilities tied to business or technology outcomes.
```json
{
  "id": "CAP001",
  "name": "Customer 360 Insights",
  "description": "Unified customer data and analytics",
  "maturity": 0.8,
  "domainId": "DOM001",
  "linkedSystems": ["SYS001", "SYS004"]
}
```
**Relationships:**  
- belongs to → `Domain`  
- links to many → `System`

---

#### **ROIResult**
Quantifies financial and operational metrics for transformation scenarios.
```json
{
  "id": "ROI001",
  "systemId": "SYS001",
  "impactScore": 0.82,
  "effortScore": 0.35,
  "savingsAnnual": 45000,
  "paybackPeriodMonths": 6,
  "lastUpdated": "2025-11-25T18:45:00Z"
}
```
**Relationships:**  
- belongs to → `System`

---

#### **AIInsight**
Encapsulates AI-derived opportunities, readiness, and automation potential.
```json
{
  "id": "AI001",
  "systemId": "SYS001",
  "frictionZones": ["low-value tasks", "skill bottlenecks"],
  "primitive": "Automation",
  "impact": 80,
  "effort": 40,
  "readiness": 60,
  "opportunityIndex": 76,
  "recommendation": "Automate report generation workflows."
}
```
**Relationships:**  
- belongs to → `System`

---

#### **Event**
Captures time-based system or integration changes for simulation.
```json
{
  "id": "EVT001",
  "timestamp": "2025-11-25T14:00:00Z",
  "type": "decommission",
  "targetSystemId": "SYS004",
  "description": "Legacy CRM removed from stack",
  "impact": {
    "upstream": 2,
    "downstream": 4
  }
}
```
**Relationships:**  
- references → `System` or `Integration`

---

#### **KPI**
Represents measurable business performance indicators.
```json
{
  "id": "KPI001",
  "name": "Customer Satisfaction",
  "metric": 89,
  "unit": "%",
  "baseline": 75,
  "source": "survey",
  "relatedDomainId": "DOM001",
  "lastUpdated": "2025-11-24T10:30:00Z"
}
```
**Relationships:**  
- belongs to → `Domain`  
- influenced by → `ROIResult`, `AIInsight`

---

### 2. Data Lineage & Versioning
- Every entity persisted under `.fuxi/data` includes a `lastUpdated` and `source` field.  
- Each file maintains version history via Mesh `RepoService` commits.  
- No destructive overwrites; all data transforms append deltas or new versions.  
- Deletion or rollback must pass a signed Mesh commit event.

---

### 3. Schema Integration Map
| UX Module | Consumed Entities | Primary Relationships |
|------------|-------------------|-----------------------|
| Enterprise Map | System, Integration, Domain | System ↔ Integration ↔ Domain |
| ROI Visualization | System, ROIResult | System ↔ ROIResult |
| AI Opportunity Engine | System, AIInsight | System ↔ AIInsight |
| Simulation Layer | Event, System, Integration | Event ↔ System ↔ Integration |
| Executive Dashboard | KPI, ROIResult, AIInsight | KPI ↔ ROIResult ↔ AIInsight ↔ Domain |

---

### 4. Data Safety & Validation
- JSON schemas enforced at ingestion via Zod or Joi validators.  
- Mandatory fields: `id`, `name`, `status`, `lastUpdated`.  
- Circular dependencies auto-detected and logged by validation pipeline.  
- Schema validation errors generate structured 422 responses.

---

### 5. Future Schema Extensions
| Extension | Description | Target Release |
|------------|-------------|----------------|
| **RiskEntity** | Defines risk exposure and contingency modeling | v0.6 |
| **AIRecommendationSet** | Bundled opportunity actions (automate, augment, eliminate) | v0.6 |
| **DataSourceRegistry** | Tracks ingestion provenance and refresh health | v0.6 |

---

### Success Criteria
- All data entities validated and versioned automatically.  
- Visualizations read directly from unified schema definitions.  
- AI and ROI computations consistently reference shared IDs and timestamps.  
- Ready for Codex integration in D005–D007 build chain.

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi (Architect)  
- **Issued on:** 2025-11-25  
- **Type:** Data Schema Directive  
- **Priority:** Critical  
- **Feature Branch:** `feat/d009_data_object_schema_summary`  
- **Depends On:** D003–D007  
- **Next Step:** Commit to `/Users/local8_bill/Projects/fuxi_ea/docs/features/architecture/directive_d009_data_object_schema_summary.md`


---

### Verification & Validation Table

| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Schema Validation | JSON schemas validate successfully (no 422 errors) | ☐ | Codex |  |
| Data Lineage | Versioning confirmed via RepoService commits | ☐ | Codex |  |
| Entity Linking | System ↔ Integration ↔ Domain relationships render in map | ☐ | Codex |  |
| AI Insight Mapping | AIOpportunity entities correctly link to System IDs | ☐ | Codex |  |
| ROI Consistency | ROIResult matches System cost and timestamps | ☐ | Codex |  |
| Event Playback | Event objects populate Simulation timeline without errors | ☐ | Codex |  |
| KPI Aggregation | KPI correlations load correctly in Executive Dashboard | ☐ | Codex |  |
| Schema Extension Hooks | Future entities (RiskEntity, AIRecommendationSet) reserved and pass schema tests | ☐ | Codex |  |

---

**Verification Notes:**  
All data validation to be executed post-ingestion using automated schema tests. Validation logs stored under `/data/logs/schema_validation/` and synced to Mesh RepoService for lineage tracking.
