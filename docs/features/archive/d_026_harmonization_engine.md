## Directive D026: Harmonization Engine

### Purpose
To create a unified engine that compares multiple architecture datasets (Lucid, inventory, and future-state CSVs), identifies overlaps and discrepancies, and generates a merged, canonical digital enterprise model with change classification for visualization and analytics.

---

### Problem Statement
Currently, Fuxi_EA ingests and displays artifacts (Lucid CSVs, inventory lists, etc.) independently. Without harmonization, users see static, disconnected views. This limits the ability to:
- Compare current vs. future state.
- Identify redundant, missing, or conflicting systems.
- Quantify modernization impacts (e.g., system count reduction, domain consolidation).

The Harmonization Engine enables dynamic, data-driven comparisons between multiple architecture states to inform decisions and power the Living Digital Enterprise.

---

### Objectives
1. Merge multiple datasets (Lucid, inventory, future-state, manual edits) into a single normalized structure.
2. Classify system states and relationships (added, removed, unchanged, modified).
3. Generate harmonized data for ReactFlow visualization and scenario modeling.
4. Output both machine-readable JSON and human-readable CSV summaries.
5. Emit telemetry for performance, accuracy, and simplification scoring.

---

### Functional Requirements

#### 1. Ingestion Sources
- **Normalized Lucid** (from D027 Lucid Normalizer)
- **Inventory Files** (CSV/XLSX)
- **Future-State Files** (CSV/XLSX)
- **Manual Additions** (user-entered via UI)

Each input must conform to the `SystemRecord` schema:
```json
{
  "system_name": "Order Management",
  "domain": "Commerce",
  "integration_type": "API",
  "source": "Lucid | Inventory | FutureState | Manual",
  "disposition": "retain | retire | replace | new",
  "confidence": 0.9
}
```

#### 2. Harmonization Rules
- **Match** systems by fuzzy name match (≥0.85) and domain equivalence.
- **Detect Additions:** In future-state but not in current.
- **Detect Removals:** In current but not in future-state.
- **Detect Modifications:** Same name but changed domain, disposition, or integration type.
- **Detect Unchanged:** Same name, same attributes.
- **Infer Confidence:** Weighted by source reliability (Inventory > Lucid > Manual).

#### 3. Output Schema
Produce two synchronized outputs:

**a. Harmonized Systems Table**  
Each system entry contains classification:
```json
{
  "system_name": "Order Management",
  "domain": "Commerce",
  "state": "modified",
  "change_details": {
    "integration_type": {"from": "SOAP", "to": "API"},
    "disposition": {"from": "retain", "to": "replace"}
  },
  "confidence": 0.92
}
```

**b. Harmonized Graph Data (for ReactFlow)**  
Nodes and edges labeled by change state and confidence, with styling cues:
- Added → green glow  
- Removed → red outline  
- Modified → amber fill  
- Unchanged → grey  

---

### Data Flow
```
[Lucid CSV]  ┐
             ├──▶ normalizeLucidData() (D027)
[Inventory]  ┘             │
                            ▼
                    harmonizeSystems()
                            │
           ┌────────────────┴────────────────┐
           ▼                                 ▼
[Harmonized Table]                    [ReactFlow Graph]
```

---

### Implementation Details
- Function: `harmonizeSystems(dataSets: SystemRecord[][]) => HarmonizedRecord[]`
- File: `src/domain/services/harmonization.ts`
- Logic: 
  - Normalize names to lowercase and trim.
  - Apply fuzzy matching for equivalence.
  - Generate diff matrix for attributes.
  - Compute confidence and assign state.
- Visual integration:
  - ReactFlow edge color and animation driven by state.
  - Legend appears in Digital Enterprise workspace.

---

### Telemetry Hooks
| Event | Description | Data Fields |
|--------|--------------|--------------|
| harmonization_start | Harmonization initiated | dataset_count, file_names |
| harmonization_complete | Completed run | added, removed, modified, unchanged, duration_ms |
| harmonization_conflict | Ambiguous matches requiring review | system_name, sources |

Telemetry endpoint: `/api/telemetry`

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By |
|-------------|-------------|---------|--------------|
| Input Validation | All datasets conform to SystemRecord schema | ☐ | Codex |
| Fuzzy Matching | Matches identical and similar systems correctly | ☐ | Fuxi |
| State Classification | Accurate categorization (add/remove/etc.) | ☐ | Mesh |
| Graph Styling | Visual cues match state in UI | ☐ | Clu |
| Telemetry Events | Emitted correctly during runs | ☐ | Codex |

---

### Dependencies
- Requires D027 Lucid Normalizer to preprocess Lucid data.
- Feeds harmonized output to Digital Enterprise workspace visualization.
- Interacts with D018/D019 for Simplification Score telemetry.

---

### Implementation Timeline

| Phase | Directive | Task | Owner | Notes |
|--------|------------|------|--------|--------|
| Phase 1 | D027 | Implement `normalizeLucidData()` to cleanse Lucid CSV | Codex | Must complete first; ensures clean inputs |
| Phase 2 | D026 | Implement `harmonizeSystems()` and generate harmonized table + graph | Codex | Depends on D027 output |
| Phase 3 | D026 | Integrate harmonized graph into Digital Enterprise visualization | Fuxi | Use ReactFlow styling based on change states |
| Phase 4 | D026/D027 | Validate telemetry emission and simplification score updates | Clu | Cross-check with D018/D019 | 

---

**Directive Metadata**
- **Project:** Fuxi_EA
- **Directive ID:** D026
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-28
- **Type:** Data Pipeline Engine
- **Priority:** High
- **Feature Branch:** `feat/d026_harmonization_engine`
- **Next Step:** Implement `harmonizeSystems()` using normalized data and emit harmonization telemetry.

