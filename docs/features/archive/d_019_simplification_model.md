## Directive D019: Simplification Scoring Model & Cognitive Metrics Integration

### Purpose
Defines the scoring system that quantifies simplicity and cognitive efficiency across the Fuxi_EA UX, connecting outputs from D018 (UX Simplification Framework) to D020 (Adaptive UX Engine).

This directive introduces **Component Simplicity Scores (CSS)** and **System Simplicity Scores (SSS)** that measure visual, cognitive, and behavioral efficiency across the interface.

---

### Objectives
1. Establish a quantifiable UX scoring system based on cognitive ergonomics and user flow efficiency.
2. Link simplification scores to real-time telemetry (CL, TF, ID, DC from D018).
3. Provide a data foundation for adaptive UX optimization (D020).
4. Create a universal scoring language for UI testing and design review.

---

### Core Metrics

| Metric | Description | Target |
|--------|--------------|--------|
| **Cognitive Load (CL)** | Weighted count of visible interactive elements per task step | < 0.75 |
| **Task Friction (TF)** | Avg. task completion time vs. ideal flow time | < 1.2 |
| **Information Density (ID)** | Visible text per viewport divided by threshold (900) | < 1.0 |
| **Decision Clarity (DC)** | Ratio of main-task CTAs to total CTAs | > 0.6 |
| **Component Simplicity Score (CSS)** | UI element-level score derived from PSI | ≤ 0.6 |
| **System Simplicity Score (SSS)** | Aggregated PSI + interaction friction across workspace | ≤ 2.0 |
| **Friction Index (FI)** | Median time-to-completion vs. expected flow time | ≤ 1.2 |
| **Decision Clarity Index (DCI)** | Ratio of relevant CTAs to total CTAs | ≥ 0.65 |

---

### Formulas
```
PSI = (CL + TF + ID) / DC
CSS = avg(PSI_component) × 0.7 + FrictionIndex × 0.3
SSS = weightedAvg(CSS_page) × ContextFactor
```

**Where:**
- `ContextFactor` = 0.9–1.2 multiplier based on cognitive mode (Exploration vs. Execution)
- All scores normalized to 0–5 scale for readability

---

### Implementation

**Files and Modules:**
- `src/hooks/useSimplificationMetrics.ts` — Collects PSI, CSS, and SSS via telemetry
- `src/domain/models/uxMetrics.ts` — Defines type schemas for cognitive metrics
- `src/lib/telemetry/simplificationProcessor.ts` — Aggregates and computes rolling averages
- `docs/ux/simplification_scores.json` — JSON record of each workspace’s simplification report

**Integration Points:**
- Fuses with D018 Cognitive Ergonomics Framework
- Streams data to D022 Automated UI Testing
- Supports adaptive UX module (D020) for dynamic simplification

---

### Verification & Validation

| Checkpoint | Description | Status | Verified By |
|-------------|-------------|---------|--------------|
| Component Simplification Audit | Each UI element assigned CSS | ☐ | Fuxi |
| Page PSI Calculation | PSI generated and validated across all workspaces | ☐ | Codex |
| UX Data Stream Hook | Telemetry successfully sending data to Mesh | ☐ | Mesh |
| Simplification Score Report | PSI/SSS summary logged and visualized | ☐ | Clu |

---

### Example JSON Output
```json
{
  "workspace": "Digital Enterprise View",
  "timestamp": "2025-11-26T10:45:00Z",
  "metrics": {
    "CL": 0.68,
    "TF": 1.1,
    "ID": 0.94,
    "DC": 0.63,
    "PSI": 1.2,
    "CSS": 0.55,
    "SSS": 1.9
  },
  "context": "Exploration"
}
```

---

### Directive Metadata
- **Project:** fuxi_ea
- **Directive ID:** D019
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-26
- **Type:** UX Scoring Model
- **Priority:** High
- **Feature Branch:** `feat/d019_simplification_scoring_model`
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D019_simplification_scoring_model.md`
- **Auth Mode:** Optional (FUXI_AUTH_OPTIONAL=true)

