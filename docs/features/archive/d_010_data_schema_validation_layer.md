## Directive D010: Data Schema Integration & Validation Layer

### Purpose
Unify and standardize all data models within Fuxi EA to ensure seamless interoperability between capabilities, tech stacks, services, and external data sources (e.g., Datadog). This layer guarantees consistency, traceability, and validation across all project modules.

**Status:** ✅ Completed

---

### Core Schema Definition
Each record, regardless of origin (capability, tech, service), follows a consistent structure.

```json
{
  "id": "string",
  "name": "string",
  "domain": "string",
  "type": "capability | system | service | integration",
  "team": "string",
  "owner": "string",
  "scores": {
    "maturity": "number | null",
    "opportunity": "number | null",
    "strategicAlignment": "number | null",
    "techFit": "number | null",
    "peopleReadiness": "number | null"
  },
  "dependencies": ["id", "id"],
  "cost": {
    "opex": "number | null",
    "capex": "number | null",
    "consultantSpend": "number | null",
    "fteCost": "number | null"
  },
  "metadata": {
    "source": "string",
    "lastUpdated": "datetime",
    "tags": ["string"]
  }
}
```

---

### Validation Layer
- **Engine:** Zod-based schema validation.
- **Process:**
  1. On ingestion, files pass through `/api/validate/schema`.
  2. Invalid fields return structured feedback in `validationReport.json`.
  3. Users can view results via UI (Validation Dashboard) before committing imports.
- **Output:**
  ```json
  {
    "totalRecords": 250,
    "validRecords": 247,
    "invalidRecords": 3,
    "errors": [{"id": "C101", "field": "scores.maturity", "message": "Expected number, received string"}]
  }
  ```

---

### Data Sources
| Source | Description | Integration Type | Status |
|---------|-------------|------------------|---------|
| Capabilities | Core architecture data from Fuxi EA | Local JSON | ✅ |
| Tech Stack | Applications, systems, vendors | Local/External | ✅ |
| Services | Operational telemetry (e.g., Datadog) | API/CSV | 🟡 In Progress |
| Portfolio | Programs, initiatives | CSV/API | Planned |
| Financials | Budget & cost data | ERP Extract | Planned |

---

### Normalization Rules
1. All IDs lowercase, hyphen-delimited (e.g., `capability-customer-onboarding`).
2. Null-safe scoring: missing values treated as `null`, not `0`.
3. Costs normalized to annualized USD.
4. Dates in ISO 8601 format.
5. Dependencies resolved post-ingestion (graph traversal validation).

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Schema Conformance | All records conform to JSON structure | ☐ | Fuxi |  |
| Field Completeness | No critical fields missing (id, name, domain, type) | ☐ | Mesh |  |
| Data Type Accuracy | Numeric/text alignment validated | ☐ | Codex |  |
| Dependency Graph | Valid IDs for dependencies | ☐ | Fuxi |  |
| Source Consistency | All records have a metadata.source tag | ☐ | Codex |  |
| Validation Reporting | Errors generated for invalid inputs | ☐ | Mesh |  |

---

### Integration Handoff
Validated, normalized datasets from D010 feed directly into:
- **Capability Scoring (D011–D013):** clean numeric inputs.
- **Digital Enterprise View:** dependency graph integrity.
- **Scenario Studio (D015):** trusted cost + maturity data for modeling.

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-24  
- **Type:** Data & Validation Directive  
- **Priority:** Critical  
- **Feature Branch:** `feat/d010_data_schema_validation`  
- **Next Step:** Confirm schema alignment before D015 simulation input integration.
