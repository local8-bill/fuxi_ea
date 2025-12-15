# 🧭 Directive D086L — Sequencer Temporal Graph Model + Phase Binding

**Objective:** Transform the Sequencer scene from a static graph into a *temporalized* view — allowing nodes, edges, and metrics to evolve across time phases (FY26–FY28+). This enables end-to-end testing of user-defined and ALE-suggested scenarios.

---

## 🧩 1. Problem Summary

Currently, the Sequencer view:
- Reuses the Digital Twin graph as-is (single snapshot)
- Displays phases (FY26–FY28) in the UI but does not bind them to data
- Cannot visually distinguish when systems are added, modified, or retired

This directive introduces a **Temporal Graph Model** so the Sequencer can show *what changes when*.

---

## 🧠 2. Temporal Graph Schema

Add `phase` metadata and state tracking to nodes and edges.

```ts
type SequencedNode = {
  id: string;
  label: string;
  domain: string;
  state: "existing" | "added" | "retired" | "modified";
  phase: "fy26" | "fy27" | "fy28" | "future";
};

type SequencedEdge = {
  id: string;
  source: string;
  target: string;
  phase: "fy26" | "fy27" | "fy28" | "future";
  confidence?: number;
};

type SequencerGraph = {
  phases: Record<string, { nodes: SequencedNode[]; edges: SequencedEdge[] }>;
};
```

Store each scenario (user or ALE) as a `SequencerGraph` object under `/data/sequences/<project>/<id>.json`.

---

## 🧮 3. Phase Binding Logic

### **User-defined Scenarios**
Extract timeline intent from the prompt → assign phases heuristically:
```ts
// e.g. prompt: "Replace OMS globally by 2029"
phase = inferPhaseFromPrompt(promptText, { start: 2026, end: 2029 });
```
Resulting nodes will be distributed across `fy26–fy28`.

### **ALE-suggested Scenarios**
ALE computes `phase` values using readiness + ROI/TCC deltas:
```json
"roi_signals": { "fy26": 0.12, "fy27": 0.19, "fy28": 0.27 }
```
→ Fuxi engine maps changes to nearest ROI/TCC inflection points.

---

## 🎨 4. Visualization Behavior

| Mode | View Behavior |
|------|----------------|
| **Unified View** | All phases shown together; nodes color-coded or outlined per FY band |
| **Focused View** | Selecting FY26/FY27/FY28 filters graph to that phase only |
| **Transition Playback** | Animate differences between phases (e.g., fade in added nodes, fade out retired ones) |

**Node styling example:**
```css
.node.added { border: 2px solid #22c55e; }
.node.retired { opacity: 0.4; }
.node.modified { border-style: dashed; }
```

---

## 🧭 5. Sequencer Scene Integration

In `SequencerScene.tsx`:

1️⃣ Read the stored sequence intent payload:
```ts
const payload = JSON.parse(sessionStorage.getItem("fuxi_sequence_intent"));
```

2️⃣ Load the corresponding temporal graph:
```ts
const res = await fetch(`/data/sequences/${payload.projectId}/${payload.id}.json`);
const seqGraph = (await res.json()) as SequencerGraph;
```

3️⃣ When a user clicks a timeline phase (FY26/FY27/FY28):
```ts
setActivePhase(phaseId);
setGraphData(seqGraph.phases[phaseId]);
```

4️⃣ The **GraphCanvas** re-renders automatically with that phase’s nodes/edges.

---

## 🧩 6. Phase Controls UI (Right Rail)

Add a compact “Phase Control Strip” above the ROI/TCC summary:
```
FY26 [●]   FY27 [○]   FY28 [○]   → Unified [⇆]
```

When user selects:
- Highlights the active phase in the timeline
- Filters visible graph elements
- Updates ROI/TCC metrics from ALE context by phase

---

## 🧪 7. Test Cases

| Case | Expected Behavior |
|------|--------------------|
| User loads a user-defined sequence | Graph displays nodes tagged by `phase`; timeline phases toggle view |
| User switches to ALE-suggested sequence | Phases load from ALE context; “Adopt Plan” button appears |
| Transition playback enabled | Smooth fade between `fy26 → fy27 → fy28` |
| ROI/TCC context available | Metrics update dynamically by active phase |

---

## 📊 8. Visual Reference (Simplified)

```
╔═════════════════════════════════════════════════════╗
║                SEQUENCER — FY27 View                ║
╠═════════════════════════════════════════════════════╣
║  OMS (replaced)             Vertex Integration       ║
║  ────────────────────────────────────────────────    ║
║  Added: CommerceHub B2B Layer (green outline)       ║
║  Retired: Legacy OMS Gateway (dimmed)               ║
║  Modified: Finance Adapter (dashed border)          ║
║                                                     ║
║  FY26 [○] FY27 [●] FY28 [○]  ⇆ Unified             ║
╚═════════════════════════════════════════════════════╝
```

---

## ✅ 9. Acceptance Criteria

- [ ] SequencerScene can load phase-aware `SequencerGraph` data.  
- [ ] Timeline phases control what subset of the graph is visible.  
- [ ] ALE context (ROI/TCC/readiness) updates per phase.  
- [ ] Added/retired/modified states visually distinct.  
- [ ] Both User and ALE scenarios supported with same rendering pipeline.

---

📦 **Outcome:** The Sequencer becomes a true temporal planning tool — showing how the enterprise evolves across time, phase by phase, using both user-defined and ALE-suggested sequences.

