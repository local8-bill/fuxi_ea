# Changelog
# Changelog

## v0.6.4 — UAT Baseline (Timeline + Cytoscape Integration)

- Tag: `v0.6.4-uat-baseline`
- Branch: `feat/d043_business_overlay_timeline` → `dev`
- Date: 2025-12-02

### Highlights
- Introduced Timeline Slider Integration for architectural evolution visualization.
- Established Cytoscape baseline for Ecosystem (Digital Enterprise) view.
- Enhanced Harmonization pipeline — single CSV ingestion, auto-graph generation.
- Added Telemetry instrumentation across ingestion → harmonization → visualization.
- Streamlined Project Flow & Verification Dashboard UX.
- UAT (HAT) checklist complete and validated.

### Technical Details
- Harmonization emits: `harmonization_start`, `harmonization_complete`.
- Timeline emits: `timeline_stage_changed` with visible node/edge counts.
- Graph telemetry: `graph_load`, `upload_*` events tracked locally in `.fuxi/data/telemetry_events.ndjson`.
- Fit-to-space, cross-domain filter, and legend refinements for graph visualization.
- Verified performance: ≤1.5s render time for 200 nodes / 500 edges.

### Next Focus
- Directive D044: ROI Model & Financial Overlay integration.
- Directive D041B: Graph visual refinement (SBGN + focus-lock improvements).
- Codex verification of `v0.6.4-uat-baseline` tag before promotion to main.

Release prepared by: Fuxi & Codex  
Approved by: Bill (HAT: Human Acceptance Testing ✅)
