## Directive D085H – OMS Data Stabilization & Snapshot Pipeline

### 🌟 Purpose

Establish a **snapshot pipeline** that converts live enterprise graph data and scenario definitions into a stable, versioned dataset for transformation modeling. This provides a reliable foundation for ROI/TCC simulations, readiness assessments, and sequencing logic, while maintaining full provenance from real enterprise data.

---

### 🔍 Context & Rationale

Fuxi operates at the intersection of *real data* and *strategic interpretation*. To demonstrate OMS transformation pathways:

- **Live Data** comes from enterprise uploads (current + future state).
- **Virtual Scenarios** are derived from transcript and meeting analysis (e.g., *replace EBS with S4*, *MFCS-first rollout*).
- **Static Snapshot** merges the two, providing a frozen simulation environment that can be versioned and revisited for comparison.

This directive ensures we maintain live connectivity while enabling controlled, reproducible modeling runs.

---

### 🔧 Pipeline Architecture

| Layer | Source | Description |
|-------|---------|-------------|
| **Live Data** | `/api/digital-enterprise/view?project=<id>&mode=all` | Harmonized graph from current/future-state uploads. |
| **Virtual Scenarios** | Analyst (transcript-derived) | Interpreted business intent for transformation modeling. |
| **Static Snapshot** | Combined dataset | Frozen, versioned view for OMS scenario analysis. |

---

### 🔀 Pipeline Flow

#### **1. Fetch Live Data**
```bash
curl "http://localhost:3000/api/digital-enterprise/view?project=<id>&mode=all" \
  -H "Content-Type: application/json" \
  --output /tmp/graph_live.json
```

#### **2. Transform & Merge**
- Filter for OMS and all dependent systems (EBS, MFCS, DOMS, SFCC, etc.).
- Append transcript-derived metadata (scenario type, risk, business priority).
- Normalize IDs, domains, and phase attributes.

#### **3. Snapshot**
```bash
npm run snapshot:oms
```
Creates file under `src/data/graph/snapshots/oms_<timestamp>.json` with metadata:
```json
{
  "source": "digital-enterprise-api + transcript-analysis",
  "project": "700am",
  "scenario": "MFCS-first rollout",
  "captured_at": "2025-12-11T08:32Z",
  "nodes": [...],
  "edges": [...],
  "integrations": [...]
}
```

#### **4. Load & Refresh**
- Sequencer + Graph default to **latest snapshot**.
- UI toggle: **Refresh Snapshot from Live Data** (regenerates via pipeline).
- Optional mode param: `?mode=live` for ad hoc API fetches.

---

### 🔄 Behavior & Provenance

> "Fuxi never breaks provenance — every scenario and decision stems from real enterprise data, captured, modeled, and replayable."

| Mode | Source | Purpose |
|------|---------|----------|
| **Live** | Active harmonized data | Up-to-date system topology and integrations. |
| **Snapshot** | Static, timestamped dataset | Stable environment for simulation and analysis. |
| **Scenario** | Analyst-enriched snapshot | Applied business narrative (e.g., MFCS-first rollout). |

---

### 💡 dx Implementation Checklist

| Step | Action | Output | Status |
|------|---------|---------|--------|
| 1 | Create helper command bean `npm run snapshot:oms` | Fetch + transform live API data | ✅ `scripts/snapshot_oms.ts` (ts-node) |
| 2 | Store snapshot in `src/data/graph/snapshots/` | Timestamped JSON dataset + `latest.json` | ✅ `src/data/graph/snapshots/oms_<timestamp>.json` |
| 3 | Update loader logic | Default to latest snapshot; toggle for live mode | ✅ `/api/graph/snapshot` + UI data-mode toggles |
| 4 | Annotate metadata in graph inspector | Display source + last sync timestamp | ✅ Graph Prototype + Digital Twin layout controls show captured time/source |
| 5 | Commit to branch | `feature/oms-stabilization` | 🔄 (merge via current worktree) |

---

### 📊 Success Criteria

- [x] Static snapshot successfully generated and versioned (`npm run snapshot:oms`).
- [x] Graph and Sequencer render from snapshot data by default (prototype + UXShell scenes consume `/api/graph/snapshot`).
- [x] Toggle to refresh from live API implemented (Use Snapshot / View Live buttons + `Refresh Snapshot` action).
- [x] Provenance metadata visible near the graph controls.
- [ ] Committed and tagged under `feature/oms-stabilization`.

### 🧪 Implementation Notes (Sprint Log)

- Introduced `scripts/snapshot_oms.ts` (ts-node) plus the `npm run snapshot:oms` bean so dx can capture snapshots without manual curl calls. Artifacts are stored in `src/data/graph/snapshots/oms_<timestamp>.json` and mirrored to `latest.json` for quick import.
- Added `/api/graph/snapshot` (GET → latest or live, POST → regenerate) backed by `src/lib/graph/snapshotPipeline.ts`, keeping provenance data (source, scenario, captured_at, mode) alongside nodes/edges.
- Both the Graph Prototype page and the UXShell Digital Twin scene now hit the new API, default to snapshot mode, and expose a `Use Snapshot / View Live / Refresh Snapshot` control set. Metadata text surfaces captured time + scenario directly above the canvas controls.

---

### 🔹 Notes
- The **virtual** scenario step (transcript analysis) remains an analytic process, not an app feature.
- All derived insights must retain links to their source nodes for traceability.
- Once validated, snapshot data becomes input for D085G (Readiness) and ROI/TCC modeling.

**Approvers:** Agent Z (Bill), dx  
**Branch:** `feature/oms-stabilization`  
**Dependencies:** D084C, D085A, D085G
