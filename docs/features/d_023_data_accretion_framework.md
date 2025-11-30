## Directive D023: Data Accretion Framework + Dashboard Evolution

### Purpose
To implement a unified Data Accretion Framework that allows continuous ingestion, enrichment, and validation of project artifacts (spreadsheets, diagrams, CSVs, JSONs, etc.), while evolving the dashboard from a static demo into a live telemetry and data readiness console.

This directive bridges the Adaptive UX (D020/D021) and future Agent Mesh integration — turning the dashboard into the system's central observability and guidance layer.

---

### Scope
- **Framework:** Introduce modular ingestion and validation pipelines (client + server) for structured and semi-structured data.
- **Telemetry Integration:** Feed ingestion and validation events into `/api/telemetry`.
- **Dashboard Evolution:** Transition from demo to live telemetry visualization and data health center.

---

### Key Components

#### 1. Data Accretion Framework
- **Goal:** Support continuous, incremental addition of new project data artifacts.
- **Supported Types:** CSV, XLSX, JSON, PPTX, PNG/SVG (for OCR/Lucid-like diagrams).
- **Persistence:** Continue using `.fuxi/data/` local storage until D025 (DB migration).
- **Schema:** Maintain lightweight metadata (artifact type, source, version, ingest timestamp).
- **Validation:** AI-assisted field mapping + schema consistency checks.
- **Telemetry Hooks:** Ingest start, success, validation errors, normalization complete.

#### 2. Dashboard Evolution
**Purpose:** Promote the dashboard from demo UI to live telemetry and data readiness surface.

**Upgrades:**
1. **Real-Time Telemetry Feed**  
   - Stream events directly from `/api/telemetry` (Tech Stack, Digital Enterprise, Portfolio, Intake, Insights).
   - Visualize Simplification Scores, idle states, completion signals, and friction points.

2. **Data Readiness Indicators**  
   - Display current ingestion state per workspace: ✅ clean / ⚠️ pending / ❌ missing.  
   - Show completeness gauge and time-since-last-ingestion.

3. **Adaptive UX Feedback**  
   - Sync with D020/D021: reflect adaptive themes and state awareness (e.g., highlight friction areas, success momentum).  
   - Include AI-assisted recommendations for next actions based on telemetry patterns.

4. **Agent Mesh Readiness Hooks (Future)**  
   - Establish interface contracts for agent telemetry, task progress, and orchestration metrics.  
   - This dashboard is the conceptual and visual prototype for the **Agent Mesh Console**.

---

### Implementation Sequence (for Codex)

1. **Wait for D020/D021 Completion**  
   - Adaptive UX and telemetry must be stable before implementation.

2. **Framework Implementation**  
   - Create `/api/ingestion` endpoint for new data types.  
   - Validate uploads, store in `.fuxi/data/artifacts`.  
   - Fire `telemetry.ingest_*` events.

3. **Dashboard Refactor**  
   - Split dashboard into modular widgets: Telemetry Feed, Data Readiness, Adaptive Assist.  
   - Use Recharts for visualizations (real-time updates).  
   - Introduce `useTelemetryStream` hook to subscribe to events.

4. **Testing**  
   - Verify ingestion persistence + telemetry event emission.  
   - Confirm dashboard feed accuracy and latency (<500ms local).

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Telemetry Integration Active | `/api/telemetry` receives and visualizes ingestion events | ☐ | Codex |  |
| Data Readiness Indicators Visible | Dashboard displays per-workspace completeness | ☐ | Fuxi |  |
| Adaptive UX Feedback Synced | Dashboard themes and CTAs respond to user context | ☐ | Mesh |  |
| Agent Mesh Interface Hooks | Stubbed endpoints for future Mesh integration | ☐ | Clu |  |
| Performance Validation | Telemetry refresh latency < 500ms local | ☐ | Codex |  |

---

### Directive Metadata
- **Project:** Fuxi_EA  
- **Directive ID:** D023  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-28  
- **Type:** Framework + UI Evolution  
- **Priority:** High  
- **Feature Branch:** `feat/d023_data_accretion_framework`  
- **Dependencies:** D020, D021 (must complete first)  
- **Next Step:** Stage implementation (do not execute) until UX stabilization is verified.

