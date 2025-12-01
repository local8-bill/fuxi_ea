## Directive D043 — Business Overlay & Timeline Framework

### Purpose
Integrate business-centric overlays (ROI, Cost, Risk, Modernization Sequencing) directly into the **Ecosystem View**, enabling a time-based narrative of transformation. The framework will turn harmonized system data into measurable financial and operational outcomes displayed interactively via the **Timeline Slider**.

---

### 1. Objectives
- Transform the Ecosystem View from a static architectural visualization into a **living business simulation**.
- Map every system disposition (Keep, Modernize, Replace, Retire) to tangible **ROI, Cost, and Risk** deltas.
- Introduce the **Timeline Slider** to visualize staged transformation and cumulative outcomes.
- Connect harmonized technical states (Current → Target) to **business KPIs** across time.

---

### 2. Core Components

#### a. Business Overlay Layers
Each overlay can be toggled independently from the top bar:
```
[ ROI ] [ Cost ] [ Risk ] [ Modernization ] [ Timeline ]
```

| Overlay | Data Source | Visual Representation | Notes |
|----------|--------------|------------------------|-------|
| **ROI** | Harmonization delta + inferred savings | Line chart (cost vs benefit) + gradient fill | Uses system confidence × modernization impact |
| **Cost** | Inventory metadata / user inputs | Heatmap on nodes + cumulative bar chart | Cost baseline per system with reduction over time |
| **Risk** | Dependency depth + inferred complexity | Node halo color (red→green) + risk delta chart | Risk decreases as legacy nodes are retired |
| **Modernization** | Harmonized state & sequencing | Progress arcs + stage cards | Aligns to roadmap stages (Stage 1–4) |

---

### 3. Timeline Slider (Central Interaction)
The **Timeline Slider** becomes the unifying controller for all overlays.

#### Behavior:
- Sits persistently below the graph.
- Supports discrete **stages** (e.g., Q1 2025, Q3 2025, FY26) or continuous mode.
- Dragging updates the graph to show active systems for that time slice.
- Edge fade-in/out reflects connections added or retired in that stage.

#### Implementation Details:
```ts
<TimelineSlider
  stages={["Current", "Stage 1", "Stage 2", "Future"]}
  onChange={(stage) => updateGraphForStage(stage)}
/>
```
- Each stage corresponds to a harmonization milestone.
- Overlays recompute on stage change, adjusting cost/ROI/risk curves dynamically.

---

### 4. ROI Forecast (Cost vs Benefit)
- Replace demo chart with **live ROI simulation**:
  - X-axis = months or stages
  - Y-axis = cumulative $ impact
  - Green = benefit, Red = cost
- Inputs:
  - `base_cost` from inventory
  - `change_state` from harmonization
  - `time_to_realize` from disposition or user input
- Output: Cumulative ROI delta across stages.

---

### 5. Scenario Comparison
- Compare **Current vs Future vs Stage X** dynamically.
- Derived metrics:
  - `systems_change = (future_nodes - current_nodes)`
  - `integration_change = (future_edges - current_edges)`
  - `roi_lift = benefit_gain / cost_base`
  - `risk_reduction = retired_legacy / total_dependencies`
- Expose scenario data for export (CSV, JSON).

---

### 6. Visual Interactions
- Hover over system → show projected cost impact and risk delta.
- Clicking a node highlights its timeline path (when it’s retired, replaced, or modernized).
- Overlay tooltips update per stage (e.g., "ERP Cloud ROI: +18%, Risk ↓12%").

---

### 7. Technical Integrations
- Use `ecosystem_metrics.json` (generated from harmonization) as baseline.
- Extend telemetry to capture:
  - `overlay_active`
  - `timeline_stage_changed`
  - `scenario_compare_run`
- Add `/api/business/roi` endpoint to calculate live ROI forecasts.

---

### 8. Verification Checklist
| Checkpoint | Description | Owner |
|-------------|-------------|--------|
| ROI overlay | Cost vs benefit curve responds to timeline | Fuxi |
| Cost heatmap | Node colors reflect cost delta per stage | Codex |
| Risk overlay | Node halos and chart match risk deltas | Mesh QA |
| Timeline sync | Dragging slider updates graph + overlays | Codex |
| Scenario compare | Table updates with each stage | Fuxi |

---

### 9. Future Enhancements
- Allow **user-adjusted weights** (e.g., risk tolerance, modernization aggressiveness).
- Add **ROI simulation mode**: user drags timeline and watches graph animate.
- Introduce **playback mode** for presentations: auto-advance through timeline with voice/narrative mode.

---

### Branch
`feat/d043_business_overlay_timeline`

### Tag After Completion
```bash
git tag -a v0.6.5-business-timeline -m "Added ROI/Cost/Risk overlays with Timeline integration for Ecosystem View (D043)"
git push origin v0.6.5-business-timeline
```

