# D092 — Digital Twin Upload & Ingestion Technical Design

## 1. Objective
Create a consistent upload + ingestion pipeline for Digital Twin inputs (inventory spreadsheets, Lucid exports, snapshots, etc.) so that:

- analysts can drag‑and‑drop the latest architecture inventory from the web UI,
- backend services normalize the data (including parent/child components),
- harmonized graph data stays in sync for Digital Twin + Sequencer scenes, and
- the system is ready to support richer artifact types (JPG, PNG, PPT, PPTX) later.

## 2. Scope
**In scope**
- Upload UI in Digital Twin → “Data” rail.
- File validation + staging on `/api/ingestion/*`.
- Normalization + harmonization rules and storage (.fuxi/data/…).
- Wiring the cleaned graph back into Digital Twin & Sequencer.

**Out of scope (future work placeholder)**
- Media artifact ingestion (images/decks) for Intelligence scenes.
- ALE reasoning extensions that consume uploaded decks directly.

## 3. Functional Requirements
1. Support `.csv`, `.xlsx`, `.json` uploads for both “Current” and “Future” inventories.
2. Detect whether the upload contains:
   - current‑state systems (`enterprise_current_state`),
   - future‑state proposals (`enterprise_future_state`), or
   - Lucid exports (nodes/edges JSON).
3. Store uploads under `.fuxi/data/ingested` with sanitized filenames and metadata.
4. Trigger harmonization on success to regenerate:
   - `.fuxi/data/harmonized/enterprise_graph.json`
   - `.fuxi/data/digital-enterprise/<project>.json`
   - `graph_live.json` (optional auto snapshot).
5. Honor parent↔child semantic:
   - “Parent — Subsystem” entries collapse into one node with `subcomponents`.
   - Upstream/downstream links reference the parent key.
6. Provide ingest feedback in UI (success, validation errors, conflicts).
7. Leave visible placeholder for future media types (JPG/PNG/PPT/PPTX) so the UX can add those inputs once supported.

## 4. Non‑Functional Requirements
- Max upload size 5 MB per file (aligned with existing store limits).
- Reject unsupported extensions with actionable error message.
- Write all processed data to `.fuxi/data` so CLI + server share the same source of truth.
- Telemetry: emit `digital_twin.upload_start`, `digital_twin.upload_complete`, `harmonization_start`, `harmonization_complete`.

## 5. Architecture Overview

```
UI (DigitalDataRail)
   |
   | POST /api/ingestion/inventory
   v
Upload Controller (Next.js route)
   - saves original file under .fuxi/data/ingested/raw/<timestamp>/
   - dispatches to parser (CSV/XLSX/JSON)
   - emits telemetry
   |
   | -> parseInventoryExcel / parseLucidCsv / json schema
   v
Normalized Artifacts (.fuxi/data/ingested/*.json)
   |
   | -> harmonizeSystems()
   v
Harmonized Graph (.fuxi/data/harmonized/enterprise_graph.json)
   |
   | -> saveDigitalEnterpriseView()
   v
Digital Twin cache (.fuxi/data/digital-enterprise/<project>.json)
   |
   | -> buildLivingMapData()
   v
UI scenes (Digital Twin / Sequencer)
```

## 6. Upload Handling

| Route | Purpose | Notes |
| --- | --- | --- |
| `POST /api/ingestion/inventory` | Receives files from Digital Twin UI | Already exists; extend to accept `type=current|future|lucid`. |
| `POST /api/ingestion/lucid` | Optional dedicated Lucid endpoint | Wraps `normalizeLucidData`. |
| `POST /api/ingestion/snapshot` | Optional future route for JSON graph snapshots | Direct passthrough into harmonization. |

**Steps**
1. UI uses `fetch` with `FormData`: includes file + `projectId` + `datasetType`.
2. Route:
   - sanitizes file name,
   - stores raw copy under `.fuxi/data/ingested/raw/<project>/<timestamp>-<original-name>`,
   - pipes buffer to parser.
3. Parser writes normalized JSON:
   - `inventory_normalized.json` (current)
   - `future_state.json` (future)
   - `lucid_clean.json` (lucid)
4. After parsing, call `harmonizeSystems({ mode: "all" })`.

## 7. Ingestion Rules (parent/child handling)
1. **Label splitting**  
   - split on ` — ` / ` – ` / ` - ` (handle both ASCII/Unicode dashes).  
   - primary token becomes system name (`Commerce Experience`).  
   - trailing token becomes subcomponent (`Search`).  
   - attach subcomponents to `HarmonizedSystem.subcomponents`.
2. **Upstream/Downstream**  
   - apply same split to dependency columns so edges connect parent systems.  
   - discard empty tokens.
3. **Deduplication**  
   - `normalizeKey` (lowercase + whitespace collapse) remains the canonical ID.  
   - combine evidence from Lucid/inventory/future.
4. **Disposition**  
   - current only → `removed` (unless no future provided, then `unchanged`).  
   - future only → `added`.  
   - conflicting domains → `modified`.  
5. **Storage**  
   - write `subcomponents` array to harmonized nodes and keep for Digital Twin & Sequencer.

## 8. UI Updates
1. **Digital Twin left rail (Data panel)**  
   - Add “Upload Current State (.csv/.xlsx/.json)” button.  
   - Add “Upload Future State (.csv/.xlsx/.json)” button.  
   - Add disabled placeholders for “Upload Artifact (JPG/PNG/PPT/PPTX)” with tooltip (“coming soon”).
2. **Progress feedback**  
   - show spinner + log lines (“Parsing inventory…”, “Harmonizing graph…”).  
   - surface per-file errors (invalid columns, size limit).

## 9. Future Enhancements (placeholder section)
1. **Media ingestion (JPG/PNG/PPT/PPTX)**  
   - store uploads under `.fuxi/data/media/<project>/`.  
   - run OCR/slide parsing service to extract systems & flows.  
   - attach resulting entities to the same harmonization pipeline.  
   - surface previews in Insights / Evidence drawers.
2. **Version history**  
   - allow selecting previous uploads to compare graphs (e.g., drop-down listing timestamps).
3. **Automated snapshot**  
   - after harmonization, run `scripts/snapshot_oms.ts` to refresh `graph_live.json` automatically.

## 10. Open Questions
1. Should uploads be scoped per project or global? (Assuming per project via projectId).
2. Do we need RBAC gating (e.g., only Admin can overwrite inventory)?  
3. Retention policy for raw uploads (keep last N, purge older).

---
**Next Steps**
1. Update `/api/ingestion/inventory` to accept dataset type + store raw files.
2. Extend parsers + harmonization as described (parent/child support already landed in latest patch).
3. Wire UI buttons + status messages.
4. QA: upload sample current/future spreadsheets, confirm graph + Sequencer show modules.
5. Document future media upload placeholder in UI copy.
