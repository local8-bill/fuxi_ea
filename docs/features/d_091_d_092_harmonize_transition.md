## **D091–D092 — Harmonization & Transition Flow Integration**

### 🎯 **Objective**

Unify the onboarding, harmonization, transition, and sequencing process into a single logical pipeline using the new `SceneTemplate`. This connects artifact ingestion, comparison, and transformation planning into one consistent user journey.

---

## 🧱 **Step 1: Rewire Onboarding → SceneTemplate**

### **Goal**

Ensure the `OnboardingScene` inherits the same structural and visual foundation as `DigitalTwinScene` and `SequencerScene`.

### **Implementation**

| Area                                                | Action                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/app/project/[id]/experience/page.tsx`             | Map `scene=onboarding` to `OnboardingScene` (same routing pattern as Sequencer).                    |
| `/components/experience/scenes/OnboardingScene.tsx` | Wrap the scene inside `<SceneTemplate>`, removing legacy layout components.                         |
| `/styles/uxshell.css`                               | Ensure inherited palette from Sequencer (neutral/white base, no graphite).                          |
| `/components/layout/Rail.tsx`                       | Include collapsible left/right rails as SceneTemplate slots.                                        |
| **Validation**                                      | Load `/project/[id]/experience?scene=onboarding` — layout, rails, and theme should match Sequencer. |

### **Expected Result**

A unified app layout across all scenes — one theme, one shell, one navigation pattern.

---

## ⚙️ **Step 2: Define the End-to-End Flow**

```
┌─────────────────────┐        ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐        ┌──────────────────────┐
│   OnboardingScene   │──────▶│ HarmonizeScene     │──────▶│ TransitionScene    │──────▶│ SequencerScene     │──────▶│ IntelligenceScene   │
│  (Artifact Upload)  │        │ (Normalize Artifacts)│       │ (Compute Diffs)   │        │ (Plan & Simulate)  │        │ (ROI / Insights)    │
└─────────────────────┘        └────────────────────┘        └────────────────────┘        └────────────────────┘        └──────────────────────┘
          │                             │                             │                             │                             │
          ▼                             ▼                             ▼                             ▼                             ▼
    Raw Artifacts          →   harmonized_graph.json   →   transition_payload.json   →   modernization_sequences.json   →   roi_metrics.json
```

---

## 🧩 **D091 — Harmonization Intelligence Layer**

### **Purpose**

To create a unified, trusted view of enterprise systems across multiple artifacts.

### **Process Flow**

1. **Upload** multiple architectural artifacts → parse into canonical `LivingMapData`.
2. **Unify & Deduplicate** systems, integrations, and domains.
3. **Annotate** with ALE readiness and ROI signals.
4. **Output** `harmonized_graph.json` for use in downstream stages.

### **API Endpoints**

- `POST /api/harmonize/upload` → Ingests files.
- `GET /api/harmonize/result` → Returns harmonized graph JSON.

### **Sample Output**

```json
{
  "id": "harmonized_graph_2025",
  "systems": 142,
  "integrations": 317,
  "domains": ["Commerce", "Finance", "Data"],
  "readiness": 0.81,
  "roi_estimate": 0.74
}
```

---

## ⚙️ **D092 — Transition Plane (Artifact Diff Engine)**

### **Purpose**

Enable side-by-side visualization and verification of changes between current and future architectures.

### **Functional Phases**

1. **Ingest** `current` + `future` graphs.
2. **Compute Diff**:
   ```ts
   {
     addedNodes: string[],
     removedNodes: string[],
     changedNodes: string[],
     addedEdges: string[],
     removedEdges: string[],
     changedEdges: string[]
   }
   ```
3. **Visualize** current (left) vs. future (right) with color-coded deltas (🟢 added, 🔴 removed, 🟡 changed).
4. **Validate** user-confirmed differences.
5. **Emit** `transition_verified` signal to ALE and store as `transition_payload.json`.

### **ASCII Flow — Diff Visualization**

```
Current State (Left)                 Future State (Right)
──────────────────────               ──────────────────────
  [DOMS]────[Commerce]     ──▶       [OMS]────[Commerce]
       │       │                             │
       ▼       ▼                             ▼
   [Finance] [DataHub]                 [Finance] [DataLake]

Legend: 🟢 Added  🔴 Removed  🟡 Changed
```

### **ALE Context Payload Example**

```json
{
  "contextType": "transition_verification",
  "source": "artifact_diff",
  "currentGraphId": "graph_current_2025",
  "futureGraphId": "graph_future_2028",
  "added": ["OMS", "DataHub"],
  "retired": ["DOMS"],
  "changed": ["Commerce Integration Layer"],
  "signals": ["modernization", "integration optimization"]
}
```

---

## 🧠 **ALE Learning Pathway**

```
┌──────────────────────────┐
│   HARMONIZATION SIGNALS │  →  Naming patterns, system overlaps
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│    TRANSITION SIGNALS    │  →  Change frequency, modernization cadence
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│    SEQUENCER SIGNALS     │  →  Timeline efficiency, ROI realization
└──────────────────────────┘
             ↓
┌──────────────────────────┐
│   INTELLIGENCE SIGNALS   │  →  Performance outcomes, adaptive tuning
└──────────────────────────┘
```

---

## ✅ **Deliverables**

- Onboarding rewired to SceneTemplate.
- Harmonize and Transition scenes fully defined.
- Data pipeline feeding from uploaded artifacts → harmonized graph → diff engine → sequencer.
- Verified consistency across visual and data layers.

---

> **Outcome:** A unified, end-to-end framework that takes an enterprise from artifact ingestion to modernization sequencing — all within the same architectural shell and ALE context.

