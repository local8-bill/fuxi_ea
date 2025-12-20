# D090 — Document Naming Convention Standard

## Purpose
Keep Fuxi_EA docs, directives, datasets, and seeds **findable, sortable, and non-chaotic** across Canvas, repo, and shares.

This standard is intentionally **simple**. If it gets complicated, it’s not a standard — it’s a hobby.

---

## 1) Canonical ID + Title

### Directives (product requirements)
**Format (Canvas title):**
- `D### — <Short Title>`

**Rules**
- `D###` is **always** the primary key.
- Title is **sentence case**, no emojis.
- One directive = one clear outcome.

**Examples**
- `D100 — Sequencer At-a-Glance Usability, Conflicts, and Scenario Cards`
- `D100A — Risk Posture Learning & Provenance`

### Design Docs (technical / architecture)
**Format (Canvas title):**
- `DD — <Area> — <Short Title>`

**Examples**
- `DD — App Architecture — Vercel + Postgres + Mistral`
- `DD — ROI/TCC — Forecast & Explainability`

### Math Explainers
**Format (Canvas title):**
- `ME — <Topic> — Math Explainers`

**Example**
- `ME — ROI/TCC — Math Explainers`

---

## 2) “Final” Rule

When you declare something complete, its **final form** should be labeled:
- `Final — <same name as Canvas>`

Example:
- `Final — D100 — Sequencer At-a-Glance Usability, Conflicts, and Scenario Cards`

(You handle moving it to Teams/local. I don’t invent new version suffixes.)

---

## 3) Repo File Names

### Markdown (preferred)
**Format:**
- `<id>_<slug>.md`

**Slug rules**
- kebab-case
- keep it short
- no dates unless the doc is inherently time-bound

**Examples**
- `d100_sequencer-at-a-glance.md`
- `d100a_risk-posture-learning.md`
- `dd_app-architecture_vercel-postgres-mistral.md`
- `me_roi-tcc_math-explainers.md`

### JSON / CSV seeds
**Format:**
- `<family>_<scope>_<purpose>_seed.<ext>`

**Families**
- `sequence_...`
- `scenario_...`
- `tcc_...`
- `roi_...`
- `provenance_...`
- `stores_...`

**Examples**
- `sequence_canada_teva_rollout_seed.json`
- `sequence_canada_teva_rollout_seed_stages.csv`
- `tcc_inputs_canada_seed.json`
- `provenance_oms_phasing_seed.json`
- `stores_summary_by_country_brand.csv`

---

## 4) Dates (when to use them)
Only include dates in filenames when **the date is part of the meaning**:
- executive readouts
- meeting recaps
- snapshots

**Format:** `YYYY-MM-DD` (because time is a flat circle and we like sorting).

Example:
- `snapshot_exec-recap_2025-12-08.md`

---

## 5) How you “enforce” this on me

### The simple rule
If you start a request with:
- `NAME:`

…I will treat that as the **required output name**.

### The second simple rule
If you say:
- `Make this a directive` → I will assign the next `D###` you specify (or ask you for the number only if you did not supply one).

### The third simple rule
If you say:
- `Mark Final` → I will use the `Final — ...` label.

---

## 6) Guardrails
- No “v17-final-final2” nonsense.
- No mixed conventions.
- If a doc doesn’t have an ID, it’s either a note or it needs an ID.

---

## Acceptance
- Every saved artifact is sortable and uniquely referencable.
- You can say “open D100” and it’s unambiguous.
- Seeds and datasets are guessable by name (without opening them).

