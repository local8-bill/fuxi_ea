## Directive D037a — Code Review Refactor & Pre-Ship Cleanup
**Branch:** `refactor/code_review_pass_v1`  
**Tag After Completion:** `v0.6.9-pre-ship-cleanup`

---

### 🎯 Purpose

Stabilize and optimize the Fuxi_EA codebase before the first *Ship Pack (D038)* release by removing dead state, unifying telemetry schema, and enforcing runtime consistency.  
No data model or harmonization logic changes are permitted during this pass.

---

### ✅ In-Scope Tasks

#### 1. **LivingMap.tsx — UI/Render Optimization**
- Remove unused `layout` / `direction` state values.  
- Replace repeated `.find()` calls with a pre-built `id → meta` map.  
- Eliminate `setDomainBoxes` inside `useMemo` (derive overlays directly).  
- Collapse redundant base edge creation (`type: "straight"` → unified pass).  
- Prune empty tooltips (AI/ROI placeholders).

#### 2. **Telemetry Schema Consolidation**
- Unify all telemetry record definitions in `src/lib/telemetry/schema.ts`.  
- Remove duplicates from `src/controllers` and `src/hooks`.  
- Use a single `recordTelemetry(event: TelemetryEvent)` entrypoint.

#### 3. **API Route Runtime Corrections**
- Ensure all API routes that use `fs` / `path` export:
  ```ts
  export const runtime = "nodejs";
  ```
- Verify harmonization and ingestion routes compile correctly under Next.js Edge.

---

### ⚠️ Out-of-Scope (Defer Until Post-Ship)
- Async FS refactor in `harmonization.ts`.  
- Caching/index optimization for Jaccard resolver.  
- Server-side DE graph filtering logic.  
- Ingestion “truth/overlap” guards.  
- Any harmonization or inference logic.

---

### 🧩 Test & Verification
| Checkpoint | Expected Result | Owner |
|-------------|----------------|--------|
| Graph Render | Layout and pan performance unchanged or improved | Codex |
| Telemetry | Events still written correctly to `.fuxi/data/telemetry_events.ndjson` | Fuxi |
| API Build | All fs-based routes deploy cleanly under Node runtime | Mesh QA |
| No Functional Drift | Harmonization/DE output identical pre- and post-refactor | Codex |

---

### Notes
- All changes should be atomic and individually testable.  
- After passing local smoke tests, commit and push:
  ```bash
  git add .
  git commit -m "Refactor: UI cleanup + telemetry schema unify + runtime fix (D037a)"
  git push origin refactor/code_review_pass_v1
  git tag -a v0.6.9-pre-ship-cleanup -m "Pre-Ship cleanup and refactor alignment"
  git push origin v0.6.9-pre-ship-cleanup
  ```

