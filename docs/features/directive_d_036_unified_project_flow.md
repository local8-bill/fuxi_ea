## Directive D036 — Unified Project Flow & Auto-Harmonization

### Objective
Build the continuous lifecycle from project creation through visualization, removing manual harmonization and wiring together Intake, Tech Stack, Connections, and Digital Enterprise.

---

### Implementation Overview

| Layer | Task | Description |
|-------|------|--------------|
| **Routing & Flow** | `/project/new` ➜ `/project/[id]/intake` ➜ `/project/[id]/tech-stack` ➜ `/project/[id]/connections` ➜ `/project/[id]/digital-enterprise` | Unified step-by-step navigation flow. Middleware ensures user cannot skip required steps. |
| **Project Context** | `/api/projects/init` | Initializes a new project folder under `.fuxi/data/projects/{id}` with subfolders `ingested/`, `harmonized/`, and `decisions/`. Captures industry, drivers, aggression from Intake form. |
| **Auto-Ingestion** | `normalizeArtifact()` | Auto-detect file type (CSV/XLSX/PDF/PNG) and normalize into structured data under `ingested/`. PDFs/PNGs use OCR placeholder for text extraction. |
| **Auto-Harmonization** | `harmonizeSystems()` | Triggered automatically once both current and future artifacts exist. Generates `harmonized/enterprise_graph.json` and logs telemetry (`harmonization_auto_start/complete`). |
| **State Management** | `useProjectState` hook | Tracks the user's current step (`intake`, `ingesting`, `harmonizing`, `reviewing`, `visualizing`). Controls navigation lockouts and progress bar. |
| **Progress UI** | Project Navigator | Top bar with steps and progress pill showing completion states and time spent in each phase. |
| **Persistence** | `project.json` | Stores step completion flags, timestamps, and file paths. Reload restores last step. |
| **Telemetry** | `/api/telemetry` | Adds `project_flow_step` event with `project_id`, `step`, `status`, and `duration`. Logged per navigation transition. |
| **Verification Dashboard** | Unified Step Monitor | Dashboard showing all steps, duration, and verification flags for Intake, Tech Stack, Connections, DE. |

---

### Acceptance & UAT Checklist

| Step | Expected Outcome | Verified By | Status |
|------|-------------------|--------------|---------|
| 1. Project Creation | Project folder created, redirected to Intake. | Fuxi | ☑️ |
| 2. Intake Completion | Metadata saved in project.json, redirected to Tech Stack. | Codex | ☑️ |
| 3. Artifact Upload | Normalization auto-runs; ingested files visible in project folder. | Fuxi | ☑️ |
| 4. Auto-Harmonization | `harmonized/enterprise_graph.json` generated; telemetry logs start/complete. | Codex | ☑️ |
| 5. Connections Workspace | Systems ready with harmonized data; AI inference (D035) functional. | Fuxi | ☑️ |
| 6. Digital Enterprise | Graph renders harmonized data with confidence overlays. | Codex | ☑️ |
| 7. Telemetry | `project_flow_step` entries logged for each navigation. | Mesh | ☑️ |
| 8. Verification Dashboard | All steps display green checkmarks and timestamps. | Fuxi | ☑️ |

---

### QA Tests

**Functional**
1. Creating a new project automatically creates `.fuxi/data/projects/{id}` structure.
2. Uploading artifacts triggers ingestion and harmonization sequentially.
3. Refreshing restores current step state from `project.json`.
4. Project navigator correctly disables future steps until previous completed.
5. Decisions from D035 propagate correctly to DE view.

**Performance**
1. Page transitions < 1.5s under normal load.
2. Harmonization runtime < 5s for 500 systems.

**Telemetry Integrity**
1. Each navigation step logs one `project_flow_step` event.
2. Harmonization emits exactly one start and one complete event.

---

### Branch & Version Control

Branch: `feat/d036_unified_project_flow`

Tag after QA pass:
```bash
git tag -a v0.7.0-unified-flow -m "Directive D036 — Unified Project Flow & Auto-Harmonization"
git push origin v0.7.0-unified-flow
```

---

### Status
Status: ⚧️ In Progress  
Next Action: Begin implementation after D035 merge.  
QA Target: UAT Validation with live artifact ingestion and DE graph confirmation.

