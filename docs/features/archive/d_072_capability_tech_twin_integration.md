# D072 – Capability ↔ Tech Twin Integration Blueprint

## Objective
Connect capability models to the technology twin (graph + ROI + sequencer) so that capability gaps, costs, and risks flow through the UXShell and downstream views.

## Scope
1) Capability Model Ingest  
2) Mapping Layer (capability ↔ systems/domains)  
3) UXShell Surfacing (command deck + insights)  
4) ROI/Sequencer Alignment (per-capability cost/benefit deltas)  
5) Telemetry instrumentation

## Data Contracts
- Capability node: `{ id, name, tier, owner, criticality, risk, domain }`
- Mapping: `{ capabilityId, systemId, strength: 0..1, evidence? }`
- Gaps: `{ capabilityId, severity, notes }`

## API Endpoints (stubs)
- `/api/capabilities/context?project=:id`
- `/api/capabilities/mappings?project=:id`
- `/api/capabilities/gaps?project=:id`

## UXShell Integration
- Left rail: “Capabilities” section (chevron pattern per D060B).
- Insight rail: show top 3 capability gaps with links to graph filters.
- Command deck: prompt examples (“Show gaps in Order Mgmt”, “Highlight systems for Capability X”).

## Telemetry
- `capability_gap_viewed`
- `capability_mapping_applied`
- `capability_filter_active`

## Milestones
- Phase 1: stubs + UXShell surfacing.
- Phase 2: bind to graph filters/ROI rollups.
- Phase 3: sequencer impact (stage-specific capability shifts).

## Notes
- Keep read-only until mappings validated.
- Reuse harmonized domains for initial mapping hints.
