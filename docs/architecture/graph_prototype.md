# Graph Prototype Reference

This note captures the current (Dec 2025) implementation of the live OMS transformation prototype so future iterations can snap back to the same behavior quickly.

---

## 1. Data Flow Overview

1. `GraphPrototypePage` starts with the legacy JSON dataset (`src/data/graph/oms_transformation.json`) so the UI never renders empty.
2. On mount we hit `/api/digital-enterprise/view?project=dx-monitor&mode=all` (no-store cache).
3. The response nodes feed into `buildGraphDatasetFromApi`, which groups systems by domain and keeps the static timeline band metadata.
4. State (`graphDataset`, `timelineBands`, `domains`) flows into the graph components (`GraphCanvas`, `GraphSequencerPanel`, `GraphPredictivePanel`, etc.), giving us a live view that still honors the template layout.
5. ROI/TCC overlays come from `src/data/roi_tcc.json` keyed by system id; store counts come from `useStoreData`.

Key files:
- `src/app/dev/graph-prototype/page.tsx`
- `src/components/graph/*`
- `src/hooks/usePredictiveScenarios.ts`, `useStoreData.ts`, `useGraphTelemetry.ts`

---

## 2. dx Monitor & Backup Policy

* `monitorGraphData` (`src/agents/dx/liveMonitor.ts`) runs on every API fetch. It stays read-only, logs domain coverage, node/edge counts, and orphans.
* Before touching live data we call `verifyLatestBackup()` which in turn invokes `/api/dx/verify-backup`. The server helper (`liveMonitorServer.ts`) scans the `/backups` directory for `graph_*.json` files and checks size/mtime.
* Console output tells us:
  - Whether we’re operating in read-only API mode
  - Latest backup status
  - Node/edge totals and any anomalies (missing domains, orphan nodes)
* Policy: proceed even if no backup exists, but always log the warning. This keeps the UI interactive while reminding us to capture backups.

API helpers:
- `src/app/api/dx/verify-backup/route.ts`
- `src/app/api/ale/*` for recording learning events.

---

## 3. Component Responsibilities

| Component / Hook | Purpose |
| ---------------- | ------- |
| `GraphCanvas` | Renders timeline bands, domain cards, system pills, integration highlights. Props: `focus`, `stage`, `domains`, `timeline`, telemetry hooks. |
| `GraphSimulationControls` | Playback, reveal stages, timeline chips, “Store overlay” toggle. |
| `GraphSequencerPanel` | Drag-to-reorder modernization phases, playback controls for the sequencer. |
| `GraphPredictivePanel` | Surfaces `usePredictiveScenarios` output, lets user activate ALE suggestions. |
| `NodeInspector` | Shows ALE reasoning tags, risk level, recent learning events. |
| `GraphEventConsole` | Simple log (mostly for dev) fed by `logLearningEvent`. |
| Hooks (`useGraphNarration`, `useGraphTelemetry`, `useStoreData`) | Provide narration blurbs, telemetry emission helpers, and region store summaries. |

Each of these lives under `src/components/graph/` or `src/hooks/`.

---

## 4. Pulling Live Data Manually

Capture the current harmonized graph as JSON:

```bash
curl "http://localhost:3000/api/digital-enterprise/view?project=700am&mode=all" \
  -H "Content-Type: application/json" \
  --output graph_live.json
```

Use the resulting file for backups or to seed `oms_transformation.json` when working offline.

---

## 5. Safety Routine

* Tag before risky changes: `git tag pre-dx-sync-$(date +"%Y-%m-%d_%H-%M") && git push origin --tags`
* Quick checkpoints via `safecommit` alias (adds/commits/pushes with timestamp).
* End-of-day tag: `git tag end-of-day-$(date +"%Y-%m-%d")`

This keeps `main` reversible even while iterating directly on it.

---

### Future Enhancements

1. Add a tiny “graph health” overlay (green/red dot) in the UI fed by `monitorGraphData`.
2. Feed orphan-node stats into ALE for longitudinal learning.
3. Automate backups after a successful monitor run.

Keep this reference updated whenever the data flow or monitoring rules change.
