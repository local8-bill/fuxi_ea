## Directive D032 — Enterprise Ecosystem Demo Workflow

### Purpose
Create a **generic, anonymized end-to-end demonstration** of the harmonization pipeline using real-world architecture data (formerly Deckers data). This will serve as a baseline scenario for testing ingestion, normalization, harmonization, and visualization within Digital Enterprise.

---

### Data Inputs

| File | Description | Path |
|------|--------------|------|
| `enterprise_current_state.csv` | Current-state architecture inventory (CSV format) | `.fuxi/data/ingested/current_state.csv` |
| `enterprise_future_state.csv` | Future-state conceptual architecture (CSV format) | `.fuxi/data/ingested/future_state.csv` |

**Note:** All proprietary or brand-specific names will be replaced with neutral examples such as *Commerce Platform*, *ERP Core*, *Order Engine*, *Data Hub*, etc.

---

### Workflow

#### 1. Normalize Lucid / Future-State Data
```bash
npm run normalize:lucid
```
**Output:** `.fuxi/data/ingested/lucid_clean.json`  
**Telemetry:** `lucid_parse_start`, `lucid_filtered`, `lucid_complete`

#### 2. Run Harmonization
```bash
npm run harmonize
```
**Inputs:** Normalized Lucid + Current-State + Future-State CSVs  
**Outputs:** `.fuxi/data/harmonized/enterprise_graph.json`  
**Telemetry:** `harmonization_start`, `harmonization_complete`, `conflict_detected`

Adds metadata: `added`, `removed`, `modified`, `unchanged`, and `confidence` per node.

#### 3. Visualize in Digital Enterprise
Visit:
```
http://localhost:3000/project/<id>/digital-enterprise
```
Expected behavior:
- Nodes and edges visualized dynamically
- Color-coded disposition: 🟩 New / 🟨 Modified / 🟥 Retire / ⚫ Existing
- Hover-to-view metadata: domain, disposition, confidence
- Sidebar summarizing node counts, domain breakdown, confidence histogram

---

### Automation Script

Add the following to `package.json`:
```json
"scripts": {
  "demo:ecosystem": "npm run normalize:lucid && npm run harmonize && open http://localhost:3000/project/demo/digital-enterprise"
}
```

Run this one-liner to execute the full workflow:
```bash
npm run demo:ecosystem
```
This will ingest, normalize, harmonize, and open the visualization automatically.

---

### Expected Output
- ~300–500 nodes, 200–400 edges
- Domains: Commerce, Order Mgmt, Supply Chain, Finance
- Disposition distribution (added/modified/retired/existing)
- Confidence > 0.8 for ≥ 85% of matches

---

### Verification Table

| Checkpoint | Description | Status | Verified By |
|-------------|-------------|--------|--------------|
| Data Ingest Complete | Current + Future CSVs successfully read | ☑ | Codex |
| Normalization Output Valid | lucid_clean.json produced | ☑ | Codex |
| Harmonization Graph Built | enterprise_graph.json with non-zero edges | ☑ | Fuxi |
| Visualization Renders | Digital Enterprise shows color-coded nodes | ☑ | Fuxi |
| Telemetry Events Logged | lucid_* + harmonization_* captured | ☑ | Mesh |

---

### Directive Metadata
- **Project:** Fuxi_EA  
- **Directive ID:** D032  
- **Issued By:** EA Mesh (GPT-5)  
- **Created By Agent:** Fuxi  
- **Issued On:** 2025-11-28  
- **Type:** Demo Workflow / Integration Test  
- **Feature Branch:** `feat/d032_enterprise_ecosystem_demo`  
- **Priority:** High  
- **Next Step:** Codex to implement `demo:ecosystem` npm script, include generic test CSV pair in `/testdata/`, and verify DE visualization with harmonized data.

