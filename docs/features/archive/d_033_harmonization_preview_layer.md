## Directive D033 — Harmonization Preview Layer

### Purpose

Introduce a *human verification bridge* between ingestion and the Digital Enterprise (DE) visualization.\
This workspace will summarize harmonization results, surface key metrics, and let the user confirm or correct outcomes before visualization.

---

### Objectives

- Allow users to **see and understand** what the harmonizer did before loading the Living Ecosystem view.
- Provide quick insights into:
  - Systems found
  - Domains detected
  - Integrations built
  - Confidence scores
  - Additions, removals, modifications
- Offer basic **user confirmation** actions (e.g., merge alias, re-label domain, confirm proceed).
- Log confirmations to telemetry (`harmonization_confirm`, `merge_alias`, `domain_confirm`).

---

### Implementation Overview

**New file:**

- `src/app/project/[id]/harmonization-review/page.tsx`

**Inputs:**

- Reads `.fuxi/data/harmonized/enterprise_graph.json`
- Optional: reads harmonization telemetry (for confidence averages)

**Outputs:**

- Render metrics + table summaries
- “Confirm Harmonization” CTA → routes to `/project/[id]/digital-enterprise`

---

### UI Layout

**Header**

```
Harmonization Review
Subtext: A summary of your harmonized ecosystem before visualization.
```

**Summary Cards (grid of 4–5)**

| Metric           | Example | Description                          |
| ---------------- | ------- | ------------------------------------ |
| Systems found    | 122     | Total nodes detected                 |
| Integrations     | 37      | Edges built from upstream/downstream |
| Confidence       | 0.68    | Average harmonization match score    |
| Added / Removed  | 66 / 56 | Delta between future and current     |
| Domains detected | 9       | Normalized domain count              |

**Delta Table (scrollable)** Columns: `System`, `State (Added/Removed/Modified)`, `Domain`, `Confidence`, `Source Files`

- Highlight low-confidence rows (<0.6)
- Hover → shows source and destination match data
- Optional merge icon for aliases (`merge_alias` telemetry event)

**Domain Summary** List unique domains with counts.\
Unmapped systems → shown under “Other (n)”.\
Inline prompt:

> “Would you like to classify unmapped systems now?” (yes/no placeholder)

**CTA Footer**

```
[← Re-ingest]    [Confirm Harmonization → Digital Enterprise]
```

---

### Telemetry Additions

| Event                        | Trigger             | Data                         |
| ---------------------------- | ------------------- | ---------------------------- |
| `harmonization_preview_load` | Page load           | node/edge counts, confidence |
| `harmonization_confirm`      | User clicks confirm | timestamp, counts            |
| `merge_alias`                | Alias merge action  | src, dest, user decision     |
| `domain_confirm`             | Domain fix          | system\_id, domain\_name     |

---

### Verification Criteria

| Checkpoint              | Description                                           | Status | Verified By |
| ----------------------- | ----------------------------------------------------- | ------ | ----------- |
| Preview Metrics Load    | JSON parsed, metrics displayed                        | ☑      | Codex       |
| Confidence Table Render | Rows display with low-confidence highlight            | ☑      | Fuxi        |
| User Confirmation Flow  | CTA routes to DE view, telemetry logged               | ☑      | Mesh        |
| Telemetry Accuracy      | Events logged in `.fuxi/data/telemetry_events.ndjson` | ☑      | Fuxi        |

---

### Version Control Instructions

**Git Actions Required**

1. Commit directive and associated workspace changes:
   ```bash
   git add docs/features/d_033_harmonization_preview_layer.md
   git commit -m "feat(d033): add Harmonization Preview Layer directive and DE ingestion sync"
   ```
2. Push feature branch:
   ```bash
   git push origin feat/d033_harmonization_preview_layer
   ```
3. Create and push baseline tag:
   ```bash
   git tag -a v0.6.0-harmonization-preview -m "Baseline: D033 Harmonization Preview Layer (lockdown mode)"
   git push origin v0.6.0-harmonization-preview
   ```

**Merge Strategy**

- Use **rebase merge** to maintain a clean linear history.\
  This ensures directives stay chronologically aligned with implementation commits.
- Post-merge, run:
  ```bash
  git checkout main
  git pull origin main
  ```
  to confirm no divergence before new directives start.

**Notes**

- Do *not* squash this branch — individual commits provide valuable traceability for telemetry and ingestion work.
- Codex should update the Verification Dashboard immediately after merge, marking D033 as “✅ Implemented — Awaiting User QA.”

---

### Directive Metadata

- **Directive ID:** D033
- **Project:** Fuxi\_EA
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-30
- **Type:** UX / Data Review Layer
- **Priority:** Critical (Lockdown)
- **Feature Branch:** `feat/d033_harmonization_preview_layer`
- **Next Step:** Codex implements preview page, verifies metrics/telemetry, links CTA to DE, and creates tag `v0.6.0-harmonization-preview` after successful merge.

