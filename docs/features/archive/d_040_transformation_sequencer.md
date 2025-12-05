## Directive D040 — Transformation Sequencer

### Purpose
Enable users to **sequence and visualize the implementation order** of technology transformations derived from harmonized current and future state data. The sequencer establishes dependency-driven timelines that communicate *what changes, when, and why* across the digital enterprise.

---

### 🌐 Goals
- Transform harmonization output into actionable, time-sequenced roadmaps.
- Allow users to visualize dependencies, critical paths, and modernization waves.
- Link system-level changes to business outcomes (value streams, cost, risk).
- Serve as the foundation for cost insight, ROI forecasting, and adaptive planning.

---

### 1. Input Model

#### Data Sources
- **Current State CSV / Inventory:** defines existing systems, domains, and dependencies.
- **Future State CSV:** defines target systems and intended relationships.
- **Harmonization Output:** merged view with system state (`added`, `removed`, `modified`, `unchanged`) and inferred connections.

#### Additional Derived Data
- Dependency graph (edges with confidence).
- Domain clusters.
- System health/complexity scores (optional for later cost modeling).

#### Mock Dataset Specification (10-System Scenario)

| System Name | Domain | State | Upstream | Downstream | Notes |
|--------------|--------|--------|-----------|-------------|--------|
| Salesforce CRM | CRM | Modified | - | ServiceHub, Commerce Engine | Expanding integration reach |
| ServiceHub | CRM | Added | Salesforce CRM | OMS | New customer support platform |
| Commerce Engine | Commerce | Modified | Pricing Service | OMS, PIM | Will migrate to SaaS |
| Pricing Service | Pricing | Unchanged | - | Commerce Engine | Core logic stable |
| PIM | Product | Modified | Commerce Engine | ERP | Enhanced product enrichment |
| ERP (EBS) | ERP | Removed | PIM | RMS | Legacy ERP decommissioned |
| RMS | Merchandising | Added | ERP | OMS | Replaces old merchandising tools |
| OMS | Order Management | Added | Commerce Engine, RMS | WMS | Core order system replacement |
| WMS | Logistics | Modified | OMS | 3PL | Integration modernization |
| 3PL Connector | Logistics | Unchanged | WMS | - | External partner integration |

This dataset will generate a graph with clear cross-domain dependencies and 3 transformation waves: modernization, SaaS migration, and decommissioning.

---

### 2. Transformation Logic

| State | Sequencer Behavior | Default Phase |
|--------|--------------------|----------------|
| **Added** | New systems to be introduced | **Phase 2: Introduce** |
| **Modified** | Systems undergoing upgrade/migration | **Phase 1: Stabilize** |
| **Removed** | Systems scheduled for decommission | **Phase 3: Retire** |
| **Unchanged** | Systems remaining steady | **Persistent Baseline** |

Dependencies drive ordering:
- If `System B` depends on `System A`, then A must precede B.
- Cycles or unknowns produce *review required* flags.

Sequencer infers **critical paths** and **parallelizable work streams** based on dependency density and domain grouping.

---

### 3. Visualization Design

#### Core Layout
- Horizontal timeline (x-axis = months, quarters, or phases).
- Vertical swimlanes by **domain** (Commerce, ERP, CRM, etc.).
- Systems represented as cards with state color codes:
  - 🟢 Added
  - 🟠 Modified
  - 🔴 Removed
  - ⚪ Unchanged (greyed baseline)

#### Interaction
- **Hover:** Highlight system dependencies (upstream/downstream).
- **Click:** Opens side drawer with metadata (state, rationale, dependencies, notes).
- **Drag:** Adjust phase assignment manually (updates stored project data).
- **Shift+Click:** Lock focus on a domain or dependency chain.

#### Example Mock View
```
Phase 1: Stabilize   Phase 2: Introduce   Phase 3: Retire
|----------------|-----------------|----------------|
 ERP:  EBS -> OMS -> RMS
 CRM:  Salesforce -> ServiceHub
 COM:  Pricing -> Commerce Engine -> OMS
```

---

### 4. Phasing Rules & AI Assist

AI heuristics recommend sequencing based on:
- Dependency chains.
- Change impact (systems with high downstream count = earlier priority).
- Domain readiness (based on harmonization confidence or user tags).

Prompt example:
> *“You’re introducing Enterprise OMS. 7 systems depend on it. Suggest moving OMS implementation to Phase 1.”*

System confidence < 0.6 triggers caution flag.

---

### 5. Integration Hooks

| Event | Payload | Description |
|--------|----------|--------------|
| `sequencer_init` | project_id, system_count | When user enters sequencer view |
| `phase_change` | system_id, from_phase, to_phase, rationale | When a system is rephased |
| `dependency_alert` | system_a, system_b, type | When ordering conflicts arise |
| `timeline_export` | phase_map, total_systems | When user exports roadmap (CSV/PDF) |

All telemetry flows into `/api/telemetry` with `workspace_id: "sequencer"`.

---

### 6. Output
- Harmonized graph annotated with `phase` and `sequence_index`.
- Export options:
  - CSV (system, domain, state, phase, dependencies)
  - PNG/PDF (visual timeline)
- Future: JSON API for integration into portfolio or cost models.

---

### 7. Verification / QA Checklist
| Checkpoint | Description | Owner |
|-------------|-------------|--------|
| Input Load | CSV/graph successfully harmonized | Codex |
| Sequencing | Dependency order validated | Fuxi |
| Phase UI | Manual drag/drop updates persisted | Codex |
| AI Assist | Suggests valid reorder based on dependencies | Fuxi |
| Telemetry | All sequencer events logged | Mesh QA |
| Export | Timeline exports correctly | Codex |

---

### Branch
`feat/d040_transformation_sequencer`

### Tag After Completion
```bash
git tag -a v0.6.4-transformation-sequencer -m "Transformation Sequencer: dependency-driven roadmap visualization (D040)"
git push origin v0.6.4-transformation-sequencer
```

