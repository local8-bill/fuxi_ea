## Directive D029: Normalization + Harmonization Verification

### Purpose
To validate the new harmonization pipeline that unifies Lucid exports, inventory data, and future-state diagrams into a single canonical graph powering the Digital Enterprise workspace.  
This ensures that all downstream visualizations, insights, and telemetry are based on clean, deduplicated, and contextually enriched system data.

---

### Overview

This directive covers:
1. Lucid CSV normalization  
2. Harmonization of normalized Lucid + inventory + future-state data  
3. Visualization validation within the Digital Enterprise workspace  
4. Manual and automated verification checkpoints  

---

### Implementation Scope

**Files:**  
- `src/domain/services/ingestion.ts` → add `normalizeLucidData()`  
- `src/domain/services/harmonization.ts` → add `harmonizeSystems()`  
- `src/app/api/digital-enterprise/view/route.ts` → return harmonized graph  
- `.fuxi/data/ingested/` → Lucid and inventory input files  
- `.fuxi/data/harmonized/enterprise_graph.json` → final output  

**Events:**  
- `lucid_parse_start`, `lucid_filtered`, `lucid_complete`  
- `harmonization_start`, `harmonization_conflict`, `harmonization_complete`  

**Telemetry:**  
- Log node/edge counts, deduplication ratio, and average confidence.  

---

### Verification Table

| Checkpoint | Description | Verified By | Tool / Method |
|-------------|--------------|-------------|----------------|
| Lucid Parse | Containers / Images removed | **Codex** | Unit test + telemetry event |
| Edge Map | `Line Source → Destination` converted to edges | **Codex** | Jest test + schema check |
| Enrichment | Deckers metadata joined | **Fuxi** | Manual data diff + telemetry review |
| Harmonized Graph | Written to `.fuxi/data/harmonized/enterprise_graph.json` | **Codex** | File existence + validation script |
| Visualization | DE workspace renders harmonized graph end-to-end | **Codex** | Manual UI verification (dev build) |
| Future Automation (Placeholder) | Will move to Mesh automated verification pipeline | *(Deferred)* | *(Workstream: Mesh Testing Framework)* |

---

### Workstream Note: Future Mesh Integration

Visualization verification will migrate to the **Mesh testing framework**, enabling automated validation of:
- Graph rendering fidelity  
- Harmonization accuracy  
- Telemetry completeness  

For now, this is a *tracked but inactive workstream* until Mesh reintegration resumes.

---

### Directive Metadata

- **Project:** Fuxi_EA  
- **Directive ID:** D029  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Executed by:** Codex  
- **Issued on:** 2025-11-28  
- **Type:** Harmonization Validation  
- **Status:** 🚧 In Progress  
- **Feature Branch:** `feat/d029_harmonization_verification`  
- **Next Step:** Visualization QA → merge to main → archive directive

