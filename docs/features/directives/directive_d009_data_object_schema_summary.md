## Directive 0009: Fuxi EA Data Object Schema Summary (Canonical Copy)

**Branch in use:** `feat/d007_core_visualization_roadmap` (holding copy); target feature branch per directive: `feat/d009_data_object_schema_summary`. Timestamp: 2025-11-26T01:24Z.

### Purpose
Define the unified data object schema that underpins Fuxi EA so visualization, analytics, and simulation share a consistent vocabulary (supports D003–D007 and beyond).

### Core Entities & Relationships (high-level)
- **System:** app/service metadata (domain, disposition, ROI/AI scores, owner, cost, tags) → belongs to Domain; has Integrations; referenced by ROIResult/AIInsight.
- **Integration:** source/target systems, type, frequency, volume, criticality → belongs to two Systems.
- **Domain:** business grouping with color/description → has many Systems.
- **Capability:** functional capability tied to outcomes → belongs to Domain; links many Systems.
- **ROIResult:** financial/operational metrics (impact, effort, payback) → belongs to System.
- **AIInsight:** AI-derived opportunity/readiness → belongs to System.
- **Event:** time-based changes for simulation → references System/Integration.
- **KPI:** measurable business indicators → belongs to Domain; influenced by ROIResult/AIInsight.

### Data Lineage & Versioning
- `.fuxi/data` entries must include `lastUpdated` and `source`.
- Version history via Mesh commits; no destructive overwrites; deltas/append-only.
- Deletion/rollback requires signed Mesh commit event.

### Schema Integration Map
- Enterprise Map: System, Integration, Domain
- ROI Visualization: System, ROIResult
- AI Opportunity Engine: System, AIInsight
- Simulation Layer: Event, System, Integration
- Executive Dashboard: KPI, ROIResult, AIInsight, Domain

### Data Safety & Validation
- Enforce JSON schemas (Zod/Joi) at ingestion; mandatory `id`, `name`, `status`, `lastUpdated`.
- Detect/log circular dependencies; return 422 on schema errors.

### Future Extensions
- RiskEntity, AIRecommendationSet, DataSourceRegistry (target v0.6)

### Directive Metadata
- Project: fuxi_ea
- Issued by: EA Mesh (GPT-5)
- Created by Agent: Fuxi (Architect)
- Issued on: 2025-11-25
- Type: Schema Directive
- Priority: Foundational
- Feature Branch: `feat/d009_data_object_schema_summary`
- Depends On: D007
- Next Step: save canonical copy here

### Verification & Validation (status as of 2025-11-26T01:24Z)
| Checkpoint | Description | Status | Verified By | Timestamp |
| --- | --- | --- | --- | --- |
| Entity Definitions | Core entities captured with required fields | ☑ | Codex | 2025-11-26T02:58Z |
| Validation Rules | Ingestion schemas implemented (Zod/Joi) | ☑ | Codex | 2025-11-26T02:58Z |
| Lineage Rules | Versioning/append-only enforced | ☐ | Mesh |  |
| Integration Map | Modules consume schema consistently | ☐ | Codex |  |
| Extensions Plan | Risk/AIRecommendation/DataSource registry scoped | ☐ | Fuxi |  |
