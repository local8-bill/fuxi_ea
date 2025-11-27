## UX Baseline Report v1

**Run ID:** baseline_run_v1  
**Date:** _(fill in)_  
**Project:** Fuxi_EA  
**Conducted by:** _(Bill / team)_  

### Overview
Initial baseline pass across Intake, Tech Stack, Digital Enterprise, Portfolio, and Insights (when available). Telemetry source: `.fuxi/data/telemetry_events.ndjson` via `/api/telemetry`. Simplification Scores (D019) included when present.

### Quick Stats (from telemetry)
- Sessions: _(n)_
- Events: _(n)_
- Avg session duration: _(s)_
- Workspaces touched: _(list)_

### Workspace Metrics (telemetry)
| Workspace | Events | Errors | Avg duration (s) | Notes |
|-----------|--------|--------|------------------|-------|
| Intake | | | | |
| Tech Stack | | | | |
| Digital Enterprise | | | | |
| Portfolio | | | | |
| Insights | | | | |

### Simplification Signals (D019)
- Snapshot count: _(n)_
- Avg SSS: _(value)_
- Observations: _(notes)_

### Qualitative Notes (manual)
- Friction points:
- Smooth moments:
- Navigation/wayfinding:

### Recommendations
- _(Top 3)_

### How to regenerate
Run the telemetry summary script after exercising the app:
```
node scripts/telemetry-summary.js
```
Copy relevant metrics into the sections above.
