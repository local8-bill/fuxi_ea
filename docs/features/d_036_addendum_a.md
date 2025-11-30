## Directive D036 — Addendum A: Flow Completion & Middleware Controls

### 🎯 Objective  
Finalize the Unified Project Flow by enforcing step discipline, tracking user progress, and verifying state integrity across routes.

---

### 🧭 Open Implementation Items

| Area | Enhancement | Description |
|------|--------------|--------------|
| **1. Middleware / Route Gating** | `/middleware/projectFlowGuard.ts` | Prevent direct navigation to later steps (`/tech-stack`, `/connections`, `/digital-enterprise`) before Intake or prior steps complete. Reads from `project.json` flags. Redirects to last incomplete step. **Clarification:** Auto-harmonization should trigger once *valid ingested artifacts exist*, not specifically when both current and future CSVs are uploaded. The presence of mixed artifact types (Excel, CSV, PDF, PNG) should satisfy this condition. |
| **2. Project Navigator UI** | `ProjectFlowBar.tsx` | Horizontal progress bar with checkpoints (`Intake`, `Tech Stack`, `Connections`, `Digital Enterprise`). Shows percentage complete and elapsed time since project creation. |
| **3. Full Auto-Ingestion** | `autoIngestArtifacts()` | Extend ingestion to handle PDFs (via OCR text extraction) and PNGs (via vision model labels). Store extracted JSON under project-scoped `ingested/` directory. Add telemetry: `artifact_extracted`, `artifact_failed`. |
| **4. Verification Dashboard** | `VerificationDashboard.tsx` | Central view showing completion state of each step, timestamps, duration, and QA tags. Pulls from project.json and telemetry. Exportable summary for UAT logs. |

---

### 🧪 QA Checklist

| Test | Expected Result | Verified By |
|------|------------------|-------------|
| Middleware reroutes if intake incomplete | Redirects to `/intake` | Fuxi |
| Auto-harmonization runs when artifacts exist | Triggered by artifact presence, not CSV count | Codex |
| Progress updates correctly after each step | Progress bar increments visually | Codex |
| PDF/PNG ingestion outputs JSON | Extracted content stored under `ingested/` | Fuxi |
| Verification dashboard aggregates correctly | Dashboard matches telemetry data | Mesh |

---

### ⚙️ Branch / Version

Branch: `feat/d036_addendum_a`  
Tag after QA:  
```bash
git tag -a v0.7.2-flow-controls -m "Addendum A: Flow Gating, Navigator UI, Auto-Ingestion, Verification Dashboard"
git push origin v0.7.2-flow-controls
```

