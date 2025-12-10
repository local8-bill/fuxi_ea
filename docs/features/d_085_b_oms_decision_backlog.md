## ⚙️ Directive D085B – OMS Decision Backlog & Scenario Mapping (with Stakeholder Influence)

### 🎯 Objective

Transform the OMS modernization dialogue (from the Deckers transcript) into a **dynamic, data-driven decision layer** that powers the Sequencer, EAgent, and ALE. This directive encodes every strategic option as a *decision node* with quantifiable metrics for **Total Cost of Change (TCC)**, **Return on Investment (ROI)**, and **Rate of Change (ROC)** — plus **stakeholder influence vectors** that capture who supports or resists each path.

---

### 🧭 Context

Source: Deckers OMS Transformation Working Session (Nick, Ralph, Jesse, Prasad, Raj, Siva, Ben, Thomas, Ronald)

Insights from transcript and diagrams:
- Multiple modernization paths (Option 1–3) debated.
- Trade-offs around coupling MFCS ↔ OMS ↔ EBS.
- Regional rollout considerations (NA vs EMEA vs APAC).
- Timing constraints (FY26–FY28).
- Risk: inventory duplication, throwaway integrations, org readiness.
- Strong personalities influencing architectural direction.

This directive formalizes those dynamics as decision data that can be visualized, scored, and narrated inside `/project/[id]/experience?scene=sequencer`.

---

### 🧱 Decision Archetypes

| Option | Description | Strategy | Coupling | Notes |
|---------|--------------|-----------|-----------|-------|
| **1. Monolithic Modernization** | Replace EBS + OMS + MFCS in unified rollout | Big-bang | Tight | High risk, high payoff; shortest parallel run. |
| **2. Incremental Hybrid (Preferred)** | Phased regional rollout, MFCS before OMS | Iterative | Moderate | Balanced path; mix of throwaway work + controlled value delivery. |
| **3. Composable Foundation** | Build composable micro-architecture; decouple OMS, MFCS, EBS | Transformational | Loose | Longest timeline; maximum flexibility; highest capability uplift. |

---

### 🧩 Core Decision Nodes (with Metrics)

| Decision | TCC | ROI | ROC | Notes |
|-----------|-----|-----|-----|-------|
| Replace EBS with MFCS | 0.82 | 0.65 | 0.48 | High integration churn; foundational move. |
| Decouple OMS from MFCS | 0.76 | 0.78 | 0.52 | Increases agility; medium-term benefit; moderate risk. |
| Run MFCS + EBS in parallel | 0.65 | 0.42 | 0.71 | Provides stability; delays benefits. |
| Regional rollout (NA first) | 0.53 | 0.61 | 0.68 | Manageable change velocity; controlled scope. |
| Adopt standalone inventory service | 0.88 | 0.79 | 0.35 | High complexity; long-term benefit. |
| Introduce composable OMS layer | 0.91 | 0.83 | 0.41 | Strategic flexibility; requires org maturity. |

---

### 🧭 Stakeholder Influence Mapping

Each stakeholder is modeled as an *influence vector* with **support (+)** or **resistance (-)** values per decision node. These values are normalized from -1 → +1 and influence the ALE’s recommendation weighting.

| Stakeholder | Role | Influence Summary | Behavioral Signature |
|--------------|------|------------------|----------------------|
| **Ralph Smith** | Architect | +0.9 for decoupled architectures; -0.6 against OMS-only moves | Prioritizes simplification and reduced duplication. |
| **Nick Smotek** | Program Lead | +0.7 for pragmatic sequencing; -0.4 on high-risk dependencies | Prefers phasing and regional balance. |
| **Jesse Carstens** | Integration Lead | +0.8 for composable and data-driven sequencing | Sees value in flexibility, cross-channel enablement. |
| **Prasad Tendulkar** | Finance / Strategy | +0.6 for ROI-heavy moves; -0.5 for high TCC paths | Concerned about business case justification. |
| **Raj Rawat** | Data / Inventory | +0.9 for centralized inventory model | Advocates data consistency and unified stock visibility. |
| **Siva Boothathan** | Engineering | +0.4 for stable architecture; -0.7 for overlapping integrations | Focused on operational simplicity. |
| **Thomas Kelly** | Consultant | +1.0 for composable modernization | External visionary, drives future-state alignment. |
| **Ben Parker** | Channel Ops | +0.7 for B2B-first sequencing | Seeks operational benefit alignment. |
| **Ronald La Belle** | Data Owner | +0.8 for data clarity; neutral on architecture | Prioritizes store-level accuracy and master data quality. |

---

### 🧮 Combined Scoring Logic (ALE Integration)

Each decision node merges structural and human factors:

```
ALE Score = (ROI * 0.4) + (1 - TCC * 0.3) + (ROC * 0.2) + (Stakeholder Support Avg * 0.1)
```

Example JSON entry:

```json
{
  "decision_id": "decouple_oms_mfcs",
  "description": "Decouple OMS from MFCS and EBS",
  "tcc": 0.76,
  "roi": 0.78,
  "roc": 0.52,
  "stakeholder_support": {
    "ralph": 0.9,
    "nick": 0.6,
    "jesse": 0.8,
    "prasad": 0.5,
    "raj": 0.7,
    "siva": 0.2,
    "thomas": 1.0,
    "ben": 0.4,
    "ronald": 0.6
  },
  "ale_score": 0.72,
  "region": ["NA", "EMEA"],
  "timeline": "FY27",
  "tags": ["foundational_system_coupling", "agility_gain"],
  "rationale": "Strong architectural consensus, moderate cost; supported by Ralph and Thomas; minor technical resistance."
}
```

---

### 🧠 EAgent Dialogue Examples

> **EAgent:** “Ralph and Thomas are heavily aligned on a decoupled model, while Siva and Prasad express concern about integration overhead. Would you like me to simulate what happens if we phase MFCS first to balance their positions?”

> **EAgent:** “Stakeholder support has increased for Option 2 after your last review — do you want to elevate it as the recommended path?”

---

### 🔁 Learning Loop Enhancement

- ALE observes correlations between **stakeholder alignment** and **decision success**.
- Learns organization-specific **biases** (e.g., architecture-heavy vs. risk-averse teams).
- Adjusts weighting dynamically per team composition.
- EAgent can forecast **approval likelihood** and recommend sequencing adjustments to reduce friction.

---

### ⚙️ Deliverables

- `/data/graph/decision_nodes.json` — includes stakeholder support metadata.
- `/dev/sequencer` — visual layer shows color-coded influence overlay.
- `/api/learning/ingest` — extended to capture user voting or sentiment on decisions.

---

### 🧭 Next Steps
1. Integrate stakeholder influence vectors into ALE computation layer.
2. Extend Sequencer to visualize influence heatmaps per node.
3. Enable EAgent to mediate conflicting stakeholder goals during decision sessions.
4. Begin behavioral analytics training based on stakeholder input patterns.

---

**Branch:** `feature/d085b_decision_scenarios`

**Approvers:** Fuxi Core, Agent Z (Bill), Codex

**Purpose:** Bridge structural decision modeling with human alignment analytics — turning Fuxi into a learning system that not only models architecture but *adapts to the people designing it*.

