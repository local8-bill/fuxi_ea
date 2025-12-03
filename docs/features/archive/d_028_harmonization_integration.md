## Directive D028: Harmonization Validation & Graph Integration

### Purpose
Integrate normalized Lucid data (from D027) with additional system sources (inventory, future-state) to construct a unified, canonical enterprise graph. The resulting model will serve as the source of truth for Digital Enterprise visualization, change-state tracking, and downstream analytics.

---

### Objectives
- Merge datasets from Lucid, application inventory, and future-state sources.
- Identify and label differences across states: `added`, `removed`, `modified`, `unchanged`.
- Validate and reconcile relationships to ensure graph consistency.
- Assign confidence levels and lineage metadata to each node and edge.
- Produce harmonized outputs (JSON/CSV) for graph rendering and analysis.
- Emit telemetry across all harmonization lifecycle stages.

---

### Implementation Details
**Primary Function:** `harmonizeSystems()`  
**Location:** `src/domain/services/harmonization.ts`

#### Steps
1. **Load Inputs:**
   - Import normalized Lucid data from `.fuxi/data/ingested/lucid_clean.json`.
   - Load supplemental datasets: `inventory_normalized.json`, `future_state.json`.
   - Emit `harmonization_start` telemetry event.

2. **Schema Alignment:**
   - Normalize field names and types across sources.
   - Ensure consistent keys (e.g., `system_name`, `domain`, `vendor`, `status`).

3. **Entity Matching:**
   - Use deterministic and fuzzy logic to match systems across datasets.
   - Apply priority rules (Future > Inventory > Lucid) when merging conflicting data.

4. **State Assignment:**
   - Tag systems/edges by their delta state:
     - `added`: appears in future only
     - `removed`: appears in Lucid/inventory but not future
     - `modified`: appears in both with attribute changes
     - `unchanged`: identical across datasets

5. **Confidence and Lineage:**
   - Compute confidence scores based on matching depth and data source overlap.
   - Record `source_origin` (lucid/inventory/future) for traceability.

6. **Graph Construction:**
   - Build nodes and edges with harmonized metadata.
   - Save to `.fuxi/data/harmonized/enterprise_graph.json`.
   - Emit `harmonization_complete` event with summary metrics.

7. **Error Handling & Conflicts:**
   - Emit `harmonization_conflict` for unresolved merges (log to `.fuxi/logs/harmonization_conflicts.log`).

---

### Telemetry Events
| Event ID | Description | Data Fields |
|-----------|--------------|--------------|
| harmonization_start | Harmonization initiated | input_sources, record_counts |
| harmonization_conflict | Conflicts detected during merge | conflict_count, conflict_ratio |
| harmonization_complete | Harmonization finished successfully | total_nodes, total_edges, confidence_avg |

---

### Verification & Validati