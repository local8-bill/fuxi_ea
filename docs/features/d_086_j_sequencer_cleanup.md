# 🧩 Directive D086J — Sequencer Scene Cleanup + Context Sync  
**Purpose:** Fix visual duplication, alignment, and data binding between the Digital Twin and Sequencer scenes.

---

## 🧱 Scope

| Area | File | Action |
|------|------|---------|
| Graph Node Render | `src/components/graph/GraphCanvas.tsx` | Remove duplicate “DOMAIN” labels |
| Graph Layout | `src/components/graph/GraphCanvas.tsx` | Adjust padding and spacing to prevent overlap |
| Snapshot Loader | `src/app/project/[id]/digital-enterprise/DigitalEnterpriseClient.tsx` | Load snapshot JSON from repo instead of user desktop |
| ALE Context Integration | `src/lib/ale/contextStore.ts` + `SequencerScene.tsx` | Bind ROI / TCC / Readiness context |

---

## 🧩 Implementation Tasks

### 1️⃣ Remove Duplicate “Domain” Labels
Inside **GraphCanvas**, look for the section mapping domain nodes:
```tsx
{domainNodes.map(domain => (
  <div key={domain.id} className="domain-group">
    <h3 className="text-xs font-semibold uppercase">Domain</h3>
    <h2 className="text-lg font-bold">{domain.label}</h2>
```
Replace with:
```tsx
{domainNodes.map(domain => (
  <div key={domain.id} className="domain-group">
    <h2 className="text-lg font-bold">{domain.label}</h2>
```
☑️ *Remove redundant “Domain” heading; keep the domain label only once per group.*

---

### 2️⃣ Fix Sub-node Overlap (Spacing)
Update layout constants in `GraphCanvas` props or style definition:
```tsx
domainPaddingY={72}
systemCellHeight={220}
domainVerticalGap={120}
```
☑️ *Ensures sub-nodes no longer intrude into domain highlight halos.*

---

### 3️⃣ Correct Snapshot Loading Behavior
In `DigitalEnterpriseClient`, replace:
```tsx
const file = event.target.files?.[0];
```
with:
```tsx
const res = await fetch("/data/snapshots/enterprise_graph.json");
const json = await res.json();
setGraphData(buildLivingMapData(json));
setGraphSource("snapshot");
setGraphSnapshotLabel("enterprise_graph.json");
```
☑️ *Bypasses desktop file picker and ensures consistent test data.*

---

### 4️⃣ Sync ALE Context Data in Sequencer Scene
Extend `useALEContext()` to expose ROI / TCC / Readiness values:
```ts
export const useALEContext = () => {
  const { context } = useContext(ALEContextProvider);
  return {
    roiSignals: context?.roi_signals ?? {},
    tccSignals: context?.tcc_signals ?? {},
    readiness: context?.readiness ?? {},
  };
};
```

Then in `SequencerScene.tsx`, replace placeholder metrics with:
```tsx
const { roiSignals, tccSignals, readiness } = useALEContext();
```
and bind to the ROI/TCC Summary + Adaptive Signals panels.

---

## 🧮 Visual Reference (Post-Fix Layout)

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                        SEQUENCER                         ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════╣
║  Left Rail: Focus Filters (optional)                     ║
║                                                          ║
║  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │ DOMAIN: Order Management                           ║  ║
║  │   ├─ OMS Engine                                    ║  ║
║  │   ├─ SOMT Loader                                   ║  ║
║  │ DOMAIN: Finance                                    ║  ║
║  │   ├─ EBS Satellite                                 ║  ║
║  │   ├─ Vertex Integration                            ║  ║
║  └───────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                          ║
║  Right Rail: [Sequence Panel]                            ║
║  ─ ROI / TCC Summary (bound to ALE)                      ║
║  ─ Readiness Index                                       ║
║  ─ Save Sequence Button                                  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ✅ Acceptance Criteria

- [ ] Only one “Domain” label per domain group.  
- [ ] Sub-nodes and domain halos never overlap.  
- [ ] “Load Snapshot” button loads from `/data/snapshots/enterprise_graph.json`.  
- [ ] Sequencer scene ROI/TCC/Readiness panels display values from ALE context.  
- [ ] Verified stable layout under both light/dark themes.

