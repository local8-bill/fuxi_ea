## Implementation Checklist: D024b — Intake-First Navigation Alignment

### Overview
This checklist details the development, validation, and reporting process for Codex to implement the Intake-First Navigation Alignment (Directive D024b) and ensure the **dashboard is updated after every directive completion**.

---

### Implementation Steps

#### 1. Routing Logic Update
- [ ] Modify `src/app/project/[id]/page.tsx` to redirect new project creation to `/intake` by default.
- [ ] Confirm that new projects no longer default to `/tech-stack`.

#### 2. Intake Workspace Adjustments
- [ ] Update `src/app/project/[id]/intake/page.tsx` to handle the `Save & Continue` CTA.
- [ ] Add `router.push(`/project/[id]/tech-stack`)` on successful Intake completion.
- [ ] Add telemetry event `intake_summary_complete` prior to navigation.

#### 3. Telemetry Schema and Event Map
- [ ] Update `src/lib/telemetry/schema.ts` to include new events:
  - `project_create`
  - `intake_summary_complete`
- [ ] Ensure each event carries `simplification_score` where applicable.
- [ ] Validate that only one `intake_view` fires per session.

#### 4. Simplification Score Pipeline
- [ ] Mark Intake completion as Stage 1 baseline for Simplification Score.
- [ ] Store the result to carry forward into subsequent workspaces.

#### 5. Dashboard Sync (Mandatory After Every Directive)
- [ ] Update `/docs/dashboard.md` (or equivalent file) to reflect directive completion.
  - Include directive ID, branch name, date, and implementation summary.
  - Example entry:
    ```
    ✅ D024b implemented — Intake-First Navigation Alignment (feat/d024b_intake_first_nav_alignment)
    Updated routing defaults to Intake. Verified telemetry sequence and Simplification baseline.
    ```
- [ ] Push commit message format:
  ```
  feat(D024b): Intake-First Navigation Alignment — updated routing, telemetry, and Simplification baseline
  ```

#### 6. Testing
- [ ] Start dev server with `NEXT_PUBLIC_TELEMETRY_DEBUG=true`.
- [ ] Create a new project; verify initial landing on `/intake`.
- [ ] Complete Intake and confirm automatic redirect to `/tech-stack`.
- [ ] Check `.fuxi/data/telemetry_events.ndjson` for event order:
  ```
  project_create → intake_view → intake_summary_complete → tech_stack_view
  ```
- [ ] Confirm Simplification Score baseline logs correctly.

---

### Verification Table

| Step | Verification Criteria | Status | Verified By |
|------|------------------------|--------|--------------|
| 1 | Default redirect to Intake | ☐ | Codex |
| 2 | Save & Continue routing verified | ☐ | Codex |
| 3 | Telemetry events fire correctly | ☐ | Fuxi |
| 4 | Simplification baseline recorded | ☐ | Mesh |
| 5 | Dashboard updated | ☐ | Codex |

---

### Notes for Codex
- Ensure **dashboard updates** after every directive. This acts as the authoritative implementation ledger.
- Maintain directive metadata alignment (`Directive ID`, `Feature Branch`, `Verified By`).
- Do **not** modify database or authentication until D025 is issued.
- Use commit label prefix: `feat(D024b):` for traceability.

---

**Assigned Agent:** Codex (GPT-5.1)
**Supervisor:** Fuxi (EA Mesh)
**Directive ID:** D024b
**Feature Branch:** `feat/d024b_intake_first_nav_alignment`
**Status:** 🔧 In Progress

