**Directive D052A — ROI Summary Visualization**

**Purpose:**  
Expose the calculated Net ROI, Break-even Month, and summary metrics from `/api/roi/forecast` in the ROI dashboard UI, connecting the explainable math engine (D052) to visible business insight.

---

### Implementation Details

**1. New Component:** `src/components/roi/ROISummaryCard.tsx`
- Fetch data from `/api/roi/forecast?project={id}`.
- Display top-level metrics:
  - **Net ROI** (ratio or percentage)
  - **Break-even Month**
  - **Total Cost** and **Total Benefit**
- Add status color coding:
  - ROI > 1 → 🟢 *Positive ROI*
  - ROI = 1 → 🟡 *Neutral ROI*
  - ROI < 1 → 🔴 *Negative ROI*
- Add an info icon linking to `/docs/math_explainers.md`.

**2. Placement:**
- Show at the top of the ROI Dashboard or Forecast view.
- Works with existing `/api/roi/forecast` JSON shape (which includes `netROI`, `breakEvenMonth`, `timeline`, `predictions`).

**3. Optional Visual Enhancements:**
- Animated number counter when ROI data loads.
- Tooltip or small modal with a short formula reference (from explainer).

**4. Example JSON Schema Reference:**
```json
{
  "timeline": [...],
  "predictions": {
    "breakEvenMonth": 9,
    "netROI": 1.85,
    "totalCost": 2700,
    "totalBenefit": 5000
  }
}
```

**5. Testing & Verification Checklist:**
- [ ] `curl` `/api/roi/forecast` returns valid `netROI` and `breakEvenMonth`.
- [ ] UI displays formatted ROI summary values correctly.
- [ ] Color and tooltip logic respond dynamically to ROI ratio.
- [ ] Telemetry: `roi_summary_displayed` fires when metrics render.

---

**Target Tag:** `v0.6.7-roi-summary-baseline`

**Success Criteria:**  
The ROI Dashboard displays clear, color-coded ROI metrics derived from the math engine. Users immediately understand their financial posture at a glance and can click the info icon to learn *why*.

