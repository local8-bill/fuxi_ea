## Directive D031: Tech Stack Evolution Master Directive (Updated)

### Purpose
Refocus D031 on achieving seamless ingestion, harmonization, and visualization of **real-world technology inventory data** within the Tech Stack workspace — handling multiple formats (Excel, CSV, images) with minimal user friction.

---

### Unified Objective
Establish a robust ingestion and harmonization loop that:
- Accepts heterogeneous artifacts (Excel, CSV, PNG, JSON)
- Auto-detects schema and harmonizes systems/domains/dependencies
- Surfaces naming inconsistencies and overlaps
- Feeds live insights to the **Digital Enterprise** and **Portfolio** workspaces
- Logs complete telemetry to support adaptive UX improvement

---

### Implementation Phases

#### **Phase 1 – Code & Data Cleanup**
- Remove deprecated upload components (`ModernizationImportPanel`).
- Refactor harmonization and ingestion services for modular reuse.
- Normalize `.fuxi/data/` structure; remove legacy NDJSON clutter.
- Validate telemetry events (`ingest_*`, `harmonization_*`).

#### **Phase 2 – Flexible Header Mapping (from D030)**
- Implement `resolveField()` utility for tolerant schema detection.
- Detect alternate headers like `Raw_Label`, `Logical_Name`, etc.
- Add telemetry field `header_mapping` to capture detected headers.
- Apply to both CSV and Excel ingestion paths.

#### **Phase 3 – Real Data Ingestion Cycle (New Focus)**
- Support direct upload of:
  - `tech_inventory.xlsx` — multi-sheet structured data by domain.
  - `integration_map.csv` — upstream/downstream system relationships.
  - `architecture_diagram.png` — optional OCR/AI labeling of named systems.
- After upload, automatically:
  - Normalize and harmonize all artifacts.
  - Generate `.fuxi/data/ingested/*.json` and `harmonized/enterprise_graph.json`.
  - Emit telemetry (`ingest_start`, `ingest_complete`, `harmonization_complete`).
- Display harmonization summary in Tech Stack UI:
  - Total systems processed
  - Duplicate and unmapped items
  - Data completeness score

#### **Phase 4 – Verification & Dashboard Integration**
- Validate harmonization output using **real inventory data** only.
- Confirm graph renders with correct node/edge labeling and domains.
- Update **Verification Dashboard** and `verification_log.json` upon success.

---

### Verification Protocol

| Step | Trigger | Action | Output |
|------|----------|---------|---------|
| 1 | Artifact upload | Verify file type detection and schema mapping | `ingest_complete` event |
| 2 | Harmonization run | Check `.fuxi/data/harmonized/enterprise_graph.json` for >0 nodes | Graph snapshot |
| 3 | Telemetry log | Confirm `header_mapping` and `confidence_pct` in payload | Telemetry trace |
| 4 | Digital Enterprise load | Verify clean rendering and accurate domain labels | UI confirmation |

---

### Expected Outcomes
- Tech Stack workspace can accept and unify **real mixed-format artifacts**.
- Harmonized output populates a clean, labeled graph.
- Verification Dashboard shows phase completion with metrics.

---

### Metadata
| Field | Value |
|-------|--------|
| **Directive ID** | D031 (Revised) |
| **Directive Type** | Feature Epic — Tech Stack Evolution |
| **Branch** | `feat/d031_tech_stack_evolution` |
| **Status** | 🚧 In Progress |
| **Created By** | Fuxi |
| **Primary Implementer** | Codex |
| **Verifier** | Mesh / Verification Dashboard |
| **Issued On** | 2025-11-30 |
| **Next Step** | Implement Phase 3 with real inventory data ingestion & harmonization testing |

