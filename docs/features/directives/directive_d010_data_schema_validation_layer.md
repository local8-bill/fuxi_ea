## Directive D010: Data Schema Integration & Validation Layer (Canonical Copy)

**Branch in use:** `feat/d009_data_object_schema_summary` (holding copy); target: `feat/d010_data_schema_validation_layer`. Timestamp: 2025-11-26T05:22Z.

### Purpose
Unify and standardize data models and validation across Fuxi EA so capabilities, tech stacks, services, and external sources stay consistent and traceable.

### Status
| Checkpoint | Description | Status | Verified By | Timestamp |
| --- | --- | --- | --- | --- |
| Entity Definitions | Core entities defined (system, integration, domain, capability, ROI, AI, event, KPI) | ☑ | Codex | 2025-11-26T05:22Z |
| Validation Rules | Zod validation + API exposure | ☑ | Codex | 2025-11-26T05:22Z |
| Lineage Rules | lastUpdated/source warnings, append-only policy enforcement | ☑ (warnings) | Codex | 2025-11-26T05:30Z |
| Integration Map | Modules consume validated data consistently | ☑ (DE stats uses validated systems/integrations when present) | Codex | 2025-11-26T05:38Z |
| Extensions Plan | Risk/AIRecommendation/DataSource registry scoped | ☑ | Codex | 2025-11-26T05:30Z |

### Notes
- Schemas live in `src/lib/schema/entities.ts`; loader in `src/lib/schema/loaders.ts`; validation runner in `src/lib/schema/validate.ts`.
- APIs: `/api/schema/systems` (validated systems/integrations), `/api/schema/validate` (all dataset summaries).
- Next steps: add lineage enforcement (append-only checks), wiring into ingestion pipelines, add Risk/AIRecommendation/DataSource schemas.
