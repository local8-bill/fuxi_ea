# D088A – Core Path Brief: The 4‑Blocker (Upload → Compare → Sequence → Learn)

---

## 🎯 Objective

Define the **minimal viable end‑to‑end path** that proves Fuxi’s enterprise intelligence loop: from user artifact ingestion to sequenced transformation and learning capture.  This is the lean “4‑blocker” path—the shortest, testable user story that spans the full Digital Twin, Harmonizer, Sequencer, and ALE Context system.

> *“A user uploads current and future states, Fuxi harmonizes them, shows what changed, and proposes a transformation sequence.”*

---

## 🧩 The Four Blocks

### **1️⃣ Upload (Artifacts → Model)**

**User Intent:**
> “Here are my architecture artifacts. Make sense of them.”

**System Behavior:**
- User uploads one or more `.json` or `.csv` architecture artifacts (Current + Future State).
- Harmonization Service processes inputs and unifies them into a harmonized graph.
- The system infers domains, dependencies, and change states.
- ALE Context initializes with detected metadata (domains, ROI, readiness, cost baselines).

**Expected Output:**
- `/data/harmonized/enterprise_graph.json` written.
- ALE Context initialized with `{ domains, roi_signals, readiness, tcc_baseline }`.

---

### **2️⃣ Compare (Harmonize → Delta View)**

**User Intent:**
> “Show me what’s different between these states.”

**System Behavior:**
- Digital Twin Scene renders both states as one harmonized view.
- Nodes color‑coded by change type: Added / Removed / Modified / Unchanged.
- Right Rail shows contextual actions: Build Sequence · Harmonize Stack · Add View.

**Expected Output:**
- Visible change map (graph deltas) with a clear legend.
- User can visually understand impact and transformation scope.

---

### **3️⃣ Sequence (Delta → Plan)**

**User Intent:**
> “Replace OMS globally by 2029. What’s the right path?”

**System Behavior:**
- User triggers **Build Sequence** dialogue from the Digital Twin.
- Intent is parsed by `/api/intent/parse` to extract scope, system, and timeline.
- Graph + ALE Context are cached to `sessionStorage`.
- Sequencer Scene loads with harmonized graph and parsed intent.
- Sequencer generates timeline bands (FY26‑FY28) and populates impacted systems.

**Expected Output:**
- Sequencer timeline populated with phases and systems.
- Each phase shows transitions, dependencies, ROI/TCC deltas.
- ALE Context updated with `sequence_metadata`.

---

### **4️⃣ Learn (Plan → Context Update)**

**User Intent:**
> “Save what we just learned.”

**System Behavior:**
- When a sequence is saved, the system records the plan back to ALE.
- ALE updates readiness, ROI, and dependency strength.
- Sequence history becomes part of the enterprise knowledge graph.

**Expected Output:**
- ALE Context reflects updated readiness/ROI/TCC.
- Saved sequences appear under the Sequencer rail: *OMS FY26‑28 (✔ Active)*.
- Digital Twin uses updated context for future recommendations.

---

## 🧱 Scene Transition Diagram (ASCII)

```
┌────────────────────────────┐
│     Digital Twin Scene     │
│  (Harmonized Ecosystem)    │
└────────────┬───────────────┘
             │  Build Sequence
             ▼
   ┌────────────────────────┐
   │   Sequence Dialogue    │
   │ (User defines goal)    │
   └────────────┬───────────┘
                ▼
      ┌────────────────────┐
      │   Sequencer Scene  │
      │  (Timeline Plan)   │
      └────────────┬───────┘
                   ▼
       ┌────────────────────┐
       │   ALE Context DB   │
       │  (Learning Layer)  │
       └────────────────────┘
```

---

## ✅ Success Criteria

| Step | Expected Behavior | Verified Output |
|------|--------------------|-----------------|
| Upload | Artifacts harmonized into unified graph | `enterprise_graph.json` created |
| Compare | Twin shows Added/Removed/Modified deltas | Graph visual + legend renders |
| Sequence | User builds plan → Sequencer loads | Sequencer populated with FY bands |
| Learn | Sequence saved → ALE context updates | Context shows new readiness/ROI |

---

📦 **End State:**  
Fuxi executes the complete **Upload → Compare → Sequence → Learn** flow with no manual patching, proving the cognitive loop between user input, system inference, and contextual learning.

