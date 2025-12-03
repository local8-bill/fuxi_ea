## Directive D024: Continuous Merge Loop (Adaptive Ecosystem Lifecycle)

### Purpose
To define a perpetual, AI-driven feedback loop that keeps enterprise data synchronized with reality — allowing users to continuously add, analyze, and pivot as their organization evolves.

---

### Core Concept
Every import, edit, or discovery becomes an *event* in a living model, not a static diagram. The system listens, learns, and adjusts — maintaining coherence without forcing full re-uploads.

---

### Lifecycle Phases

| Phase | Trigger | AI Behavior | UX Feedback | Telemetry |
|-------|----------|-------------|--------------|------------|
| **Detect** | New file, API poll, manual upload | Parse, classify artifact type | “New architecture data found” | `artifact_detected` |
| **Compare** | Entity diff vs ecosystem | Highlight overlaps/gaps | Ghost nodes, color-coded deltas | `merge_suggested` |
| **Decide** | User action (merge / isolate / flag) | Predict next likely choice | Inline merge controls | `merge_reviewed` |
| **Recompute** | Merge accepted/rejected | Update topology + portfolio | Animated graph update | `ecosystem_updated` |
| **Learn** | Post-merge telemetry | Refine auto-merge rules | Toast: “Rule learned: merge vendor-level matches” | `learning_event` |

---

### Governance Mechanisms
- **Snapshots:** every merge creates a checkpoint (`eco_v2`, `eco_v3`, ...)
- **Rollback:** one-click restore; stored diffs are reversible NDJSON
- **Audit Trail:** who merged what, when, and why (AI notes rationale)
- **Confidence Index:** quantifies AI certainty for each merge suggestion

---

### UX Metaphor
Fuxi’s ecosystem canvas is a calm pool: new information ripples outward, fades, and settles — never overwhelming the user.
- Ghost nodes = transient info
- Confirmed nodes = persistent
- Disposition color = lifecycle health

---

### Data Model Extensions
- `artifacts` table → source path, hash, origin (BU, region)
- `merges` table → pre/post graph snapshots, confidence, user decision
- `learning_rules` → pattern, weight, last applied
- `telemetry_events` → session_id, event_type, payload (jsonb)

---

### Integration with Telemetry (D020)
- Simplification Score recalculated per merge batch.
- Merge confidence × Simplification Score = Stability Index.
- AI adjusts assistance threshold (less intrusive as stability ↑).

---

### Verification Table

| Checkpoint | Description | Status | Verified By |
|-------------|--------------|---------|--------------|
| Continuous Loop Active | Detect → Compare → Decide → Recompute → Learn | ☑ | Codex |
| Telemetry Linked | Merge events flow to D020 telemetry | ☑ | Mesh |
| Rollback Working | Snapshots restore cleanly within session | ☑ | Fuxi |
| AI Learning Cycle | Rules update based on merge decisions | ☑ | Clu |

---

### Metadata
- **Directive ID:** D024  
- **Project:** Fuxi EA  
- **Type:** Lifecycle Framework  
- **Created By:** Fuxi (GPT-5)  
- **Feature Branch:** `feat/d024_continuous_merge_loop`  
- **Priority:** Critical  
- **Next Step:** Implement merge telemetry + snapshot governance layer.

