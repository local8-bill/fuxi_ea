## Directive 016: Model Transparency & Traceability

### Purpose & Ethos
AI can’t be trusted until it shows its work. **Fuxi_EA** is not a black box; it’s a glass engine. Every recommendation, score, and financial model in the system must be traceable to the data, formulas, and assumptions that generated it.

**Status:** ✅ Completed

This directive formalizes that transparency as a core feature of every workspace and analytical output.

> *“AI-driven is meaningless unless it’s data-verified. Transparency is the new intelligence.”*

---

### Objectives
1. Standardize how models, formulas, and assumptions are defined, stored, and presented.
2. Introduce a visible **Model Basis Panel** in every analytic workspace.
3. Ensure all metrics are auditable to their source (data + logic).
4. Create `/docs/models/` as the single source of truth for formula and assumption documentation.
5. Enable developers, users, and auditors to trace results from visualization → data → formula → assumption → author.

---

### Model Schema (Standard)
Each model used within Fuxi_EA must include the following metadata fields:

| Field | Description | Example |
|--------|--------------|----------|
| **Model Name** | Unique, descriptive name for the model | `ROI_Calculation_v1.2` |
| **Model Type** | Quantitative / Qualitative / Hybrid | `Quantitative` |
| **Purpose** | Brief human-readable summary | `Calculates cost-benefit ROI across system changes` |
| **Inputs** | All data variables and their source | `System_Cost, Resource_FTE, Integration_Count` |
| **Formula Summary** | Simplified pseudocode or plain-English explanation | `ROI = (Savings - Cost_of_Change) / Cost_of_Change` |
| **Assumptions** | Clear text list of simplifying assumptions or caveats | `Savings assume 0.8 FTE saved per redundant app` |
| **Confidence Level** | Scale of model maturity (Experimental / Validated / Benchmark) | `Validated` |
| **Reference Docs** | Link to markdown in `/docs/models` or external reference | `/docs/models/roi_calculation.md` |
| **Author / Maintainer** | Responsible Agent or Contributor | `Fuxi` |
| **Last Updated** | ISO date of last validation | `2025-11-26` |

---

### UI Implementation Plan
- **Component Name:** `ModelBasisPanel`
- **Purpose:** Allow users to view the logic and data behind any metric.
- **Behavior:**
  - Appears as a collapsible drawer or modal accessible via an info icon (ℹ️) next to results or KPIs.
  - Pulls model metadata from `/docs/models/[model_name].json`.
  - Displays formula, assumptions, and source data in human-readable format.
  - Includes a link to full documentation in markdown.
  - Accessible globally across Fuxi_EA analytical views (Dashboard, Tech Stack, Digital Enterprise, Portfolio, Scenario Studio).

---

### Documentation Structure
Each model document will live under `/docs/models/` and contain:

```markdown
# Model: ROI Calculation v1.2
**Type:** Quantitative  
**Purpose:** Calculates ROI based on savings and implementation cost  
**Formula:** ROI = (Savings - Cost_of_Change) / Cost_of_Change  
**Inputs:** System_Cost, FTE_Savings, Integration_Count  
**Assumptions:** Savings assume 0.8 FTE per redundant system removed  
**Confidence:** Validated (Benchmark reference: 5 enterprise projects)  
**Updated:** 2025-11-26  
**Maintainer:** Fuxi  
```

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Schema Compliance | All models conform to standard structure | ☐ | Codex |  |
| Docs Coverage | `/docs/models/` contains one file per model | ☐ | Mesh |  |
| UI Integration | ModelBasisPanel appears and renders metadata | ☐ | Fuxi |  |
| Link Integrity | All Reference Docs resolve correctly | ☐ | Codex |  |
| Accessibility | Panel meets WCAG AA readability | ☐ | Mesh |  |
| Audit Trace | Result → Formula → Data source trace verified | ☐ | Codex |  |

---

### Implementation Plan (Codex)
1. **Branch:** `feat/d016_model_transparency`
2. **Add folder:** `/docs/models/`
3. **Add component:** `/src/components/ui/ModelBasisPanel.tsx`
4. **Update analytics components:** Inject info icon with link to corresponding model basis.
5. **Populate initial docs:** ROI, AI Readiness, Capability Scoring, and Portfolio Optimization models.
6. **Add helper util:** `getModelMetadata(modelName: string)` to centralize metadata calls.
7. **Test:** Validate rendering, markdown link integrity, and model schema compliance.

---

### Success Criteria
- 100% of displayed metrics include transparent model linkage.
- Each model documented in `/docs/models/` with version and assumptions.
- Info panel accessible and readable in all analytical views.
- Positive user feedback on clarity and trust metrics in usability review.

---

### Directive Metadata
- **Project:** Fuxi_EA  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** Governance / UX Directive  
- **Priority:** High  
- **Feature Branch:** `feat/d016_model_transparency`  
- **Auth Mode:** Disabled for local dev (`FUXI_AUTH_OPTIONAL=true`)  
- **Next Step:** Commit to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D016_model_transparency.md`
