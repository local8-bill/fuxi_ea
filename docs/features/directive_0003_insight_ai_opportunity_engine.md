## Directive 0003: Fuxi EA Insight & AI Opportunity Engine

### Purpose

Design and implement the **Insight & AI Opportunity Engine** for Fuxi EA. This engine operationalizes the principles from OpenAI’s *Identifying and Scaling AI Use Cases* framework—transforming enterprise data into measurable insight, opportunity, and value.

---

### Objectives

1. Integrate AI opportunity discovery, scoring, and prioritization based on enterprise ingestion data.
2. Create a quantifiable reasoning model aligned with OpenAI’s use case primitives and Impact/Effort framework.
3. Generate real metrics (redundancy, ROI, readiness) to prove business and technology value.
4. Populate the new `src/domain/knowledge` layer (from D002a) with structured logic modules.

---

### Core Framework Integration

#### 1. **Friction Zones** (Root Causes for AI Opportunity)

- Repetitive low-value tasks
- Skill bottlenecks
- Navigating ambiguity

Each capability, process, or system can be tagged with one or more friction zones.

#### 2. **AI Use Case Primitives**

- Content Creation
- Research
- Coding
- Data Analysis
- Ideation / Strategy
- Automation

Each primitive acts as a classifier for where AI adds value.

#### 3. **Impact/Effort Matrix Logic**

Each opportunity is evaluated by:

- **Impact** → Potential ROI, risk reduction, time saved, scalability.
- **Effort** → Data readiness, system complexity, change management difficulty.

Use normalized scores (0–100) and compute quadrant position:

- Quick Wins (High Impact / Low Effort)
- Strategic Investments (High Impact / High Effort)
- Self-Service (Low Impact / Low Effort)
- Deprioritize (Low Impact / High Effort)

#### 4. **AI Opportunity Index**

Aggregate of weighted scores across primitives and friction zones. Formula:

```
AI_OPPORTUNITY_INDEX = (Impact * 0.6) + (Effort_Inverse * 0.3) + (Readiness * 0.1)
```

#### 5. **Visualization Hooks**

Use Recharts to visualize:

- Impact vs Effort Scatter Plot
- AI Opportunity Index by Domain
- Friction Zone Distribution (Pie/Bar)

---

### Implementation Plan (for Codex)

1. **Branch:** `feat/d003_insight_ai_opportunity_engine`
2. **Domain Setup:**
   - Extend `src/domain/knowledge/` with:
     - `ai_primitives/primitives.ts`
     - `impact_effort/scoring.ts`
     - `metrics/ai_opportunity_index.ts`
   - Include schemas for `Opportunity`, `Capability`, and `MetricResult`.
3. **Controllers:**
   - `src/controllers/insightController.ts` → computes metrics, persists to `/data/insight/`.
4. **UI Integration:**
   - Add a new route: `src/app/insights/page.tsx`.
   - Display visualizations and sortable tables for opportunities.
5. **Persistence:**
   - Store computed results in `.fuxi/data/insights/insight_results.json`.
6. **Data Source:**
   - Consume normalized ingestion data from Digital Enterprise view.
7. **Testing:**
   - Run end-to-end test: ingest → compute → visualize.

---

### Safety & Fallback

- Read-only integration to existing data; no destructive writes.
- Log all computed insights to `/mesh_prompts/completed/insight_ai_engine_log.json`.
- Rollback via `git restore src/domain/knowledge` if structure conflicts occur.

---

### Success Criteria

- AI Opportunity Engine compiles and runs.
- Visual dashboard of impact-effort and AI opportunity index works.
- Domain knowledge populated and reusable for future models.
- Computed results stored locally and accessible.
- No dependency changes.

---

### Directive Metadata

- **Project:** fuxi\_ea
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Codex 5.1 (VS Code)
- **Issued on:** 2025-11-25
- **Type:** Analytical Directive
- **Priority:** High
- **Feature Branch:** `feat/d003_insight_ai_opportunity_engine`
- **Auth Mode:** Disabled (FUXI\_AUTH\_OPTIONAL=true)
- **Source Spec:** OpenAI “Identifying and Scaling AI Use Cases”
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_ea_insight_ai_opportunity_engine.md`

