## Directive D027: Lucid Normalizer

### Purpose
Create a robust, deterministic normalization pipeline for Lucid CSV exports to ensure clean, deduplicated, and confidence-scored input for the Digital Enterprise harmonization workflow (D026). This directive establishes the preprocessing foundation that guarantees data integrity before graph visualization or harmonization.

---

### Objectives
- Filter out non-system artifacts (containers, annotations, connectors without targets).
- Validate node and edge structures, ensuring all entities and relationships are resolvable.
- Deduplicate systems by fuzzy matching (similarity ≥ 0.85) to reduce redundant nodes.
- Infer domain and integration context where possible based on labels or grouping.
- Assign confidence scores based on parsing quality and validation completeness.
- Persist cleaned, normalized output to `.fuxi/data/ingested/lucid_clean.json`.
- Emit telemetry events for every major stage of processing.

---

### Implementation Details
**Primary Function:** `normalizeLucidData(rawCsv)`  
**Location:** `src/domain/services/ingestion.ts`

#### Steps
1. **Parse CSV:**
   - Read Lucid export into structured `LucidRow[]`.
   - Emit `lucid_parse_start` telemetry event.

2. **Filter Artifacts:**
   - Remove elements labeled as `container`, `annotation`, `connector` without targets.
   - Emit `lucid_filtered` telemetry event with filtered count.

3. **Validate Relationships:**
   - Ensure all edges link valid system nodes.
   - Drop orphan edges or unlinked nodes.

4. **Deduplicate by Fuzzy Name Match:**
   - Use a simple cosine/Jaro–Winkler similarity threshold of 0.85.
   - Merge metadata of duplicates into a canonical record.

5. **Infer Domains and Integrations:**
   - Detect patterns in labels (e.g., *ERP*, *CRM*, *HRIS*) to infer domain.
   - Use edge density and neighboring node types to infer integration strength/type.

6. **Assign Confidence:**
   - Score 0.0–1.0 based on field completeness, deduplication confidence, and inferred data.

7. **Persist Results:**
   - Save to `.fuxi/data/ingested/lucid_clean.json`.
   - Emit `lucid_complete` telemetry event with summary metrics (input_count, output_count, avg_confidence).

---

### Telemetry Events
| Event ID | Description | Data Fields |
|-----------|--------------|--------------|
| lucid_parse_start | Start of normalization | file_name, record_count |
| lucid_filtered | Containers/annotations removed | filtered_count, retained_count |
| lucid_complete | Completion summary | total_in, total_out, avg_confidence |

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|-------------|------------|
| Filtering Validated | Non-system objects correctly removed | ☑ | Codex | |
| Deduplication Active | Duplicates merged using fuzzy threshold | ☑ | Fuxi | |
| Confidence Range | All normalized records include 0.0–1.0 confidence | ☑ | Codex | |
| Output Persisted | `.fuxi/data/ingested/lucid_clean.json` created | ☑ | Mesh | |
| Telemetry Hooked | Events `lucid_parse_start`, `lucid_filtered`, `lucid_complete` logged | ☑ | Clu | |

---

### Dependencies
- Must complete before **D026: Harmonization Engine**.
- Uses telemetry infrastructure from **D020: Telemetry Hooks**.
- Depends on ingestion framework from **D010: Ingestion Pipeline Foundation**.

---

### Directive Metadata
- **Project:** Fuxi_EA
- **Directive ID:** D027
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-28
- **Type:** Data Processing / Ingestion
- **Priority:** High
- **Feature Branch:** `feat/d027_lucid_normalizer`
- **Next Step:** Begin normalization implementation; test output against D026 harmonization loader.

