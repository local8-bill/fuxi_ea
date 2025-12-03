# Engineering Dashboard (last 30 days)

## Delivery / Velocity
- Commits: **223**
- Merge commits: **12**
- Churn: **+92,360 / -43,009** lines
- Churn per commit: median **102**, p95 **2,752**

Top changed files:
- package-lock.json: 28,057 lines touched
- src/app/project/[id]/tech-stack/TechStackClient.tsx: 3,505 lines touched
- src/components/LivingMap.tsx: 2,751 lines touched
- src/app/project/[id]/digital-enterprise/DigitalEnterpriseClient.tsx: 2,279 lines touched
- src/app/project/[id]/scoring/page.tsx: 1,828 lines touched

## Quality / Telemetry
- Telemetry events: **6,982**, errors: **4**
Top event types:
- portfolio_signals_ready: 2,418
- harmonization_start: 794
- harmonization_complete: 772
- ai_inference_applied: 510
- timeline_stage_changed: 482
- intake_view: 275
- harmonization_preview_load: 192
- harmonization_auto_complete: 171
- digital_enterprise_idle: 158
- workspace_view: 147

Recent events:
- 2025-11-28T16:19:16.497Z · harmonization_start
- 2025-11-28T16:19:16.500Z · harmonization_complete · {"total_nodes":0,"total_edges":0,"avg_confidence":0}
- 2025-11-28T16:33:00.575Z · harmonization_start
- 2025-11-28T16:33:00.579Z · harmonization_complete · {"total_nodes":14,"total_edges":0,"avg_confidence":0.7285714285714284}
- 2025-11-28T16:40:20.538Z · lucid_parse_start · {"file_name":"upload","record_count":165757}

## Tests / CI
- CI metrics not wired yet; add coverage/log parsing to scripts/dashboard.js to populate.

## Routes / Smoke Checklist
- `/` — home
- `/project/:id/intake`
- `/project/:id/tech-stack`
- `/project/:id/digital-enterprise`
- `/project/:id/roi-dashboard`
- `/project/:id/transformation-dialogue`
- `/project/:id/portfolio`
- APIs: `/api/roi/forecast?project=:id`, `/api/digital-enterprise/stats?project=:id`, `/api/digital-enterprise/view?project=:id`, `/api/telemetry`
