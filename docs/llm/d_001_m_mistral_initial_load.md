# D001M — Mistral Initial Load

## Purpose
Stand up **local Mistral** (LMStudio server) as an **organizational reasoning copilot** for Fuxi_EA — starting with **scenario + sequencing intelligence** (not general chat).

This is a **dev-only** integration first:
- no OpenAI dependency
- local calls from the Next.js dev runtime
- designed so DX can later “wire it in” cleanly.

---

## Outcomes

### O1 — Local LLM service contract exists
- App can call Mistral via a single internal adapter (one door in, one door out).
- Standard timeouts + retries + fallback behavior are defined.

### O2 — Repeatable “teach → retrieve → reason → trace” loop
- We can add knowledge (docs, directives, sequences) and get:
  - grounded answers
  - provenance (what it used)
  - structured outputs that fit our schemas.

### O3 — Isolated test scenarios
We can run 2–3 “known” scenarios end-to-end:
- parse a user’s natural language “Build a Sequence” input
- generate a draft sequence (stages + waves)
- detect conflicts + explain why
- produce a short executive summary

---

## Definitions

### RAG (what it means here)
**Retrieval-Augmented Generation** = the model answers using **retrieved project facts** (our docs/data) instead of guessing.

In Fuxi_EA terms:
- **Knowledge base**: directives, math explainers, sequences, store/location data, system/integration graph
- **Retriever**: search/embeddings → top-k relevant chunks
- **Reasoner**: Mistral uses those chunks to produce a grounded response
- **Provenance**: we log what chunks were used + why

---

## Architecture (MVP)

### 1) One gateway
Create a single interface:
- `LLMGateway.complete(prompt, context): { text, json?, citations? }`

Adapter:
- `MistralGateway` calling LMStudio local endpoint

Hard requirements:
- request timeout (default 20–30s)
- max tokens cap
- deterministic mode option (`temperature=0` for structured outputs)
- streaming optional later

### 2) Knowledge storage
Start simple; do not over-engineer.

**Phase 1 (fastest):**
- store docs as files + in Postgres table `knowledge_chunks`
- retrieval by keyword + lightweight scoring

**Phase 2 (recommended):**
- add embeddings + pgvector
- retrieval becomes semantic + hybrid

### 3) Chunking
- chunk size: ~400–800 tokens
- store: `chunk_text`, `source_id`, `source_title`, `section_path`, `hash`, `created_at`

### 4) Output contracts
Mistral must return **JSON** for any workflow that feeds the UI.

Minimum output shapes:
- `ScenarioDraft[]`
- `SequenceDraft` (waves + stages)
- `Conflict[]` (with rule + overlap window + object)
- `ExecutiveSummary` (CFO view)

---

## Initial “Teaching Set” (what we load first)

Load these as knowledge sources (not as training weights):
1. **D100** (sequencer at-a-glance + conflicts + scenario cards)
2. **D100A** (risk posture learning + provenance)
3. **Fuxi_EA Architecture Math Explainers** (ROI/TCC explainability)
4. Seed sequences (our JSON examples) + stage CSVs
5. Store/location summaries (country + brand)

Goal: the model can answer questions like:
- “What qualifies as a conflict in our Sequencer?”
- “Given these stages, which waves collide on integrations?”
- “Draft 3 scenario cards for Canada Teva rollout.”

---

## Test Workflows (dev-only)

### WF1 — Scenario card generator
Input: a short paragraph (like transcript notes) + optional scope (region/brand)
Output: 3–5 scenario cards matching D100 schema:
- scope, goal, primary risk, decision needed

### WF2 — Sequence draft from natural language
Input: “Build a sequence: Canada first, B2B/B2C parallel, decouple EBS from B2C…”
Output:
- waves + stages (minimum stage schema)
- systemsTouched + integrationsTouched placeholders
- blackout compliance (Nov 1 → Jan 15)

### WF3 — Conflict explanation
Input: a sequence (stages + dates + systems/integrations)
Output:
- conflicts with `ruleFired`, `overlapWindow`, `sharedObject`
- short remediation suggestions (move stage, split integration, phase gate)

---

## Provenance & Telemetry (must-have)
Log every model call with:
- `prompt_type` (scenario_draft, sequence_draft, conflict_explain, exec_summary)
- `retrieved_sources[]` (source_id + chunk ids)
- `output_schema` + validation pass/fail
- `latency_ms`, `tokens_in/out` (if available)

This is how we build **trust** and avoid “LLM vibes.”

---

## Guardrails
- No free-form “creative” output for UI workflows.
- Must validate JSON against schemas; if invalid → retry once with a repair prompt.
- If retrieval returns nothing relevant → model must say “insufficient evidence” and ask for missing inputs.

---

## Acceptance Criteria
- Local Mistral can be called from dev app via `MistralGateway`.
- We can load the teaching set into retriever storage.
- WF1–WF3 run end-to-end with validated JSON outputs.
- Responses include provenance (which sources were used).

---

## Next
Once stable:
- wire outputs into the right-rail dialogue (“Build a Sequence”)
- use the same gateway for ROI/TCC explainers in-scene (contextual math help)
- add evaluation: 10 canned prompts + expected JSON snapshots

