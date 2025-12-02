## Directive D046 — Impact Scope & ROI Inference Engine

### Summary

Extends D045 by activating AI-driven inference for impact, dependency propagation, and cost-benefit estimation. The Impact Scope & ROI Inference Engine transforms focus-system context into actionable financial and sequencing insights, enabling architects to simulate the business effect of transformation scenarios.

---

### Goals

- Generate **automated impact maps** for selected focus systems.
- Infer **scope of change** (upstream/downstream) and classify effort (S/M/L).
- Translate impact into **estimated cost and ROI curves** over time.
- Feed inferred data into the existing ROI forecast and simulation panels.

---

### Core Concept

The architect identifies focus systems (ERP, OMS, etc.) via D045.  
This directive introduces the inference layer that answers:

> “If I change this system, what’s affected, how big is the change, and when does it pay back?”

---

### Features

#### 1. **AI Impact Analysis Engine**

New endpoint: `/api/ai/impact`

**Input:**
```json
{
  "projectId": "700am",
  "focusSystems": ["ERP", "OMS"],
  "graph": { "nodes": [...], "edges": [...] }
}
```

**Output:**
```json
{
  "impacts": [
    {
      "system": "ERP Core",
      "upstream": 5,
      "downstream": 13,
      "domains": ["Finance", "Order Mgmt"],
      "effortScore": 0.82,
      "effortSize": "L",
      "risk": 0.63,
      "changeType": "replace"
    }
  ],
  "summary": {
    "totalSystemsImpacted": 18,
    "avgEffort": 0.7,
    "avgRisk": 0.55,
    "estimatedDurationMonths": 9
  }
}
```

**Engine logic:**
- Uses dependency graph to compute propagation depth and impact counts.
- Classifies effort based on:
  - number of dependent systems
  - degree centrality in graph
  - historical domain complexity factors (learned dataset)
- Assigns effort sizes (S/M/L) for early hypothesis phase.

---

#### 2. **Cost & ROI Inference Layer**

New endpoint: `/api/roi/infer`

- Combines AI impact data with project financial baselines.
- Estimates monthly burn rate, risk-adjusted delay factors, and cumulative benefit.
- Feeds data directly into `/api/roi/forecast` for graph rendering.

**Sample inferred forecast:**
```json
{
  "timeline": [
    {"month":0, "cost":200, "benefit":0},
    {"month":3, "cost":900, "benefit":350},
    {"month":6, "cost":1500, "benefit":1100},
    {"month":9, "cost":1900, "benefit":2200}
  ],
  "predictions": { "breakEvenMonth": 8 }
}
```

---

#### 3. **Scope Visualization (Ecosystem View Integration)**

- Introduce **Impact Overlay** in `/digital-enterprise`:
  - Highlights focus systems and all affected nodes with halo or edge glow.
  - Tooltip shows effort, risk, and estimated change size.
- Allow toggle: **Show Impact Scope / Show Full Graph.**
- Integrate inferred cost bands into the ROI Forecast chart.

---

#### 4. **Human-AI Collaboration Layer (HAT Integration)**

The inference outputs are never auto-committed — they enter **HAT (Human Acceptance Testing)** workflow for validation.

- Each inferred change suggestion is marked `status: proposed`.
- Architect reviews and confirms or overrides (`status: accepted | adjusted | rejected`).
- Changes propagate into project state only on approval.

Telemetry:
- `ai_impact_generated`
- `ai_inference_reviewed`
- `hat_review_complete`

---

### UX Enhancements

- Add **Impact Summary Drawer** on the right side of Ecosystem view:
  - Cards for each focus system (effort, risk, dependencies, ROI delta).
  - Quick actions: “Accept impact”, “Adjust”, “Reject”.
- ROI Forecast panel updates live as adjustments are made.

---

### Success Criteria

- ✅ AI impact inference operational and accurate within 20% tolerance on dependency counts.
- ✅ Cost and ROI estimates generated automatically per focus system.
- ✅ Impact scope visualization integrated with Cyto/Ecosystem graph.
- ✅ HAT review process functional (no auto-apply without acceptance).

---

### Dependencies

- D045 — Focus System Definition
- D043A — Timeline Hooks
- D041 — Graph Engine Overhaul (Cyto foundation)

---

### Next Steps

- Implement `/api/ai/impact` and `/api/roi/infer` using mock inference first.
- Extend graph UI to visualize inferred scope and risk glow.
- Connect ROI forecast panel to inferred data stream.
- Prepare for D047 — **Transformation Sequencer Integration**, which ties multiple focus systems into parallel ROI timelines.

