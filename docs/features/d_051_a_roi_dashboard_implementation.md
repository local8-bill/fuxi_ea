# D051A: ROI Dashboard Implementation Handoff

## 🎯 Objective
Implement the ROI Dashboard (as defined in D051) — including API extensions, visualization layer, and telemetry hooks. Deliver an interactive `/project/[id]/roi-dashboard` route that reads harmonized and financial data, and visualizes ROI trends per domain and over time.

---

## 🧰 Implementation Scope

### 1. Backend (API Layer)
**File:** `src/app/api/roi/forecast/route.ts`
- Extend response schema to include `domains` array with per-domain cost, benefit, and break-even data.
- Add `forecastByDomain()` helper in `src/domain/services/roi.ts`:
  ```ts
  interface DomainROIData {
    domain: string;
    months: number[];
    cost: number[];
    benefit: number[];
    roi: number[];
    breakEvenMonth: number;
  }
  ```
- Integrate harmonized system → domain mapping from `.fuxi/data/harmonized/enterprise_graph.json`.
- Compute break-even month per domain: first month where benefit ≥ cost.
- Return shape:
  ```json
  {
    "timeline": [...],
    "domains": [
      {
        "domain": "ERP",
        "timeline": [{"month":0,"cost":100,"benefit":20,"roi":-0.8},...],
        "breakEvenMonth": 12
      }
    ],
    "predictions": {"breakEvenMonth": 11}
  }
  ```
- Emit telemetry events: `roi_stage_calculated`, `roi_forecast_generated`.

### 2. Frontend (Visualization Layer)
**File:** `src/app/project/[id]/roi-dashboard/page.tsx`
- Build with React + Recharts.
- Components:
  - **ROI Timeline Chart** (`<ROIChart />`): multi-domain ROI curves.
  - **Break-Even Tracker** (`<BreakEvenMarkers />`): milestone lines per domain.
  - **Value Mix Chart** (`<DomainMixChart />`): waterfall/stacked visualization.
  - **Insight Cards Panel** (`<InsightPanel />`): domain summaries.
- Use Tailwind + shadcn/ui + motion transitions.
- Support toggle between *ROI %* and *Net Benefit ($)* view.

### 3. Telemetry
**File:** `src/lib/telemetry/schema.ts`
- Add new events:
  ```ts
  roi_stage_calculated
  roi_forecast_generated
  roi_focus_domain
  roi_simulation_run
  ```
- Log domain name, project ID, visible month, and ROI snapshot.

### 4. Data Model
- Update `.fuxi/data/projects/[id]/financials.json`:
  ```json
  {
    "ERP": {"baseCost": 700, "uplift": 0.6, "benefit": 700},
    "Data": {"baseCost": 300, "uplift": 0.4, "benefit": 500},
    "Finance": {"baseCost": 200, "uplift": 0.3, "benefit": 250}
  }
  ```
- Default 12-month horizon; dynamic if user modifies duration.

### 5. Mock Data for Validation
| Domain | Month | Cost | Benefit | ROI |
|---------|:------:|:----:|:-------:|:---:|
| ERP | 12 | 2,000 | 2,200 | 0.10 |
| Data | 12 | 1,250 | 2,600 | 1.08 |
| Finance | 12 | 1,000 | 1,350 | 0.35 |

Stored under `.fuxi/data/projects/700am/financials.json`.

### 6. Acceptance Criteria
- [ ] API returns domain-level ROI timeline.
- [ ] Dashboard renders all charts with real data (mock Deckers dataset).
- [ ] Telemetry logs all ROI events.
- [ ] Toggle between % and $ views.
- [ ] Performance: <1.5s render for ≤5 domains.
- [ ] Responsive layout (desktop-first, mobile-friendly summary mode).

### 7. Target Tag
`v0.6.9-roi-dashboard-implementation`

---

## 🚀 Developer Notes
- Use `framer-motion` for chart transitions.
- If harmonized graph lacks domain info, fallback to `financials.json` domains.
- Color mapping by domain consistent with DE graph legend.
- No simulation UI yet (reserved for D052).

---

## ✅ Handoff Checklist
- [ ] Branch: `feat/d051a_roi_dashboard`.
- [ ] Create `/api/roi/forecast` domain extension.
- [ ] Build `/project/[id]/roi-dashboard` UI route.
- [ ] Test with `projectId=700am` mock dataset.
- [ ] Commit → Tag → Push → Merge to `dev` after HAT signoff.

---

## 📦 Mock Data Appendix

### `financials.json`
```json
{
  "ERP": {
    "baseCost": 2000,
    "uplift": 0.15,
    "benefit": 2500,
    "monthly": [
      { "month": 0, "cost": 200, "benefit": 0 },
      { "month": 3, "cost": 800, "benefit": 200 },
      { "month": 6, "cost": 1400, "benefit": 950 },
      { "month": 9, "cost": 1800, "benefit": 1800 },
      { "month": 12, "cost": 2000, "benefit": 2500 }
    ]
  },
  "Data": {
    "baseCost": 1200,
    "uplift": 0.20,
    "benefit": 2600,
    "monthly": [
      { "month": 0, "cost": 100, "benefit": 0 },
      { "month": 3, "cost": 500, "benefit": 250 },
      { "month": 6, "cost": 900, "benefit": 1000 },
      { "month": 9, "cost": 1100, "benefit": 1900 },
      { "month": 12, "cost": 1200, "benefit": 2600 }
    ]
  },
  "Finance": {
    "baseCost": 1000,
    "uplift": 0.10,
    "benefit": 1350,
    "monthly": [
      { "month": 0, "cost": 150, "benefit": 0 },
      { "month": 3, "cost": 400, "benefit": 150 },
      { "month": 6, "cost": 700, "benefit": 400 },
      { "month": 9, "cost": 900, "benefit": 900 },
      { "month": 12, "cost": 1000, "benefit": 1350 }
    ]
  },
  "Commerce": {
    "baseCost": 800,
    "uplift": 0.25,
    "benefit": 1600,
    "monthly": [
      { "month": 0, "cost": 100, "benefit": 0 },
      { "month": 3, "cost": 300, "benefit": 150 },
      { "month": 6, "cost": 600, "benefit": 600 },
      { "month": 9, "cost": 700, "benefit": 1200 },
      { "month": 12, "cost": 800, "benefit": 1600 }
    ]
  },
  "Order Management": {
    "baseCost": 1300,
    "uplift": 0.18,
    "benefit": 1800,
    "monthly": [
      { "month": 0, "cost": 200, "benefit": 0 },
      { "month": 3, "cost": 600, "benefit": 200 },
      { "month": 6, "cost": 1000, "benefit": 750 },
      { "month": 9, "cost": 1200, "benefit": 1300 },
      { "month": 12, "cost": 1300, "benefit": 1800 }
    ]
  }
}
```

### `/api/roi/forecast` Sample Output
```json
{
  "timeline": [
    { "month": 0, "cost": 750, "benefit": 0 },
    { "month": 3, "cost": 2600, "benefit": 750 },
    { "month": 6, "cost": 5000, "benefit": 3700 },
    { "month": 9, "cost": 5700, "benefit": 7100 },
    { "month": 12, "cost": 6300, "benefit": 9850 }
  ],
  "domains": ["ERP", "Data", "Finance", "Commerce", "Order Management"],
  "predictions": {
    "breakEvenMonth": 9,
    "roiTotal": 0.56
  }
}
```

### 🧠 Notes for Codex
- Drop this JSON into `.fuxi/data/projects/700am/financials.json`.  
- Validate `/api/roi/forecast?project=700am` returns matching structure.  
- Run `npm run dev` and open `/project/700am/roi-dashboard`.  
- Expect 5 colored ROI curves, all breaking even between months 9–12.  
- Confirm telemetry events fire: `roi_stage_calculated`, `roi_forecast_generated`.  

