## 🧩 Directive D084C – Enterprise OMS Transformation Graph

### 🎯 Objective

Create a **unified, intelligent transformation model** that merges Ralph’s *Current/Future State* enterprise diagrams, his *OMS Vendor Landscape*, Jesse’s *Phasing Plan*, and Ronald’s *Store Location Dataset* into a single living graph — the **Enterprise OMS Transformation Graph**.

This graph will visualize the transition from Oracle EBS/RMS → MFCS/OMS → Future-State Unified Commerce across regions, brands, and business models, while directly linking to the Sequencer and ALE (Adaptive Learning Engine).

---

### 🧭 Context & Provenance

| Source              | Artifact                                  | Purpose                                                                     | System Layer                  |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| **Ralph Smith**     | Current State / Future State Architecture | Baseline topology and future blueprint for enterprise systems.              | Structural Foundation (L1–L2) |
| **Ralph Smith**     | OMS Vendor Landscape                      | Transition-state architecture and coupling dependencies (OMS ↔ MFCS ↔ EBS). | Strategic Layer (L3)          |
| **Jesse Carstens**  | OMS Phasing Plan (FY26–FY28)              | Temporal strategy for transformation by region and channel.                 | Sequencing Layer (L4)         |
| **Ronald La Belle** | Store Location Dataset                    | Ground-truth operational data — brand, country, region.                     | Operational Layer (L0)        |
| **Agent Z + Fuxi**  | D084A Reasoning Map                       | Semantic reasoning structure for adaptive learning.                         | ALE Integration Layer (L5)    |

---

### 🧱 Graph Composition

**1. Core Architecture Layers (Ralph’s Diagrams)**

- **Current State (Pink/Blue/Gray):** Oracle EBS-centered, legacy OMS, RMS, and siloed integrations.
- **Future State (Simplified Domains):** Unified OMS (Modern vendor), MFCS or equivalent merchandising layer, global inventory visibility, integrated data fabric.
- **OMS Landscape Overlay:** Inserts the transitional vendor layer between eCommerce, MFCS, and EBS; identifies coupling options (Tight vs. Decoupled).

**2. Temporal Banding (Jesse’s Phasing Plan)**

- FY26: “Get Some Value to All Channels” — foundational integrations, pilot OMS.
- FY27: “Bring Channels Together” — unify inventory, regional scaling.
- FY28: “Cross-Channel Inventory Unlock” — full modernization.

**3. Regional Context (Ronald’s Dataset)**

- Each domain node is linked to *Store Regions* (NA, EMEA, APAC) via operational data.
- Used for Sequencer grouping and phase prioritization.

**4. Reasoning Tags (D084A)** Attached to nodes for AI interpretation:

- `foundational_system_coupling`
- `centralized_inventory_option`
- `foundational_merchandising_layer`
- `temporary_integration_path`
- `effort_based_option_pruning`

**5. ALE Learning Loop** As the user explores, ALE observes:

- Decision Sequences (OMS first, MFCS first, parallel vs. serial).
- Dependency Density (how many systems each move touches).
- Impact/Value over Time (ROI timeline alignment).
- Risk Zones (based on inventory duplication or EBS coupling).

---

### 🎨 Visual Structure (to be implemented in ReactFlow)

```
 ---------------------------------------------------------------
|   [Guided Focus]  Domain | Goal | Stage | Region             |
|   [View Mode ▼]  Systems | ROI | Sequencer | Dependencies      |
|---------------------------------------------------------------|
|                         GRAPH CANVAS                          |
|                                                               |
|  • Clusters by Domain: OMS / MFCS / EBS / eCom / Retail       |
|  • Temporal Bands: FY26 → FY27 → FY28                         |
|  • Vendor Nodes: Oracle | Manhattan | Salesforce | Fluent     |
|  • Integration Lines: Live (EBS ↔ OMS ↔ MFCS)                 |
|  • Overlay: Store Data by Region (Ronald’s CSV)               |
|                                                               |
|  [EAgent Overlay: contextual narration + ALE insights]        |
 ---------------------------------------------------------------
```

---

### 🧩 Key Outputs

- **Fuxi Graph Dataset** (`/data/graph/oms_transformation.json`) combining all artifacts.
- **ReactFlow Scene** under `/dev/graph-oms` for prototype visualization.
- **Sequencer Sync** for simulation of regional rollout.
- **ALE Connector** for adaptive recommendations (“If OMS decoupled → inventory duplication risk +3”).

---

### ⚙️ Deliverable (Iteration 0 – Prototype Sync)

**Goal:** Align the live running prototype (`http://localhost:3000/dev/graph-prototype`) with Directive D084C to ensure continuity and correctness before advancing iterations.

| Step | Task | Owner | Target |
|------|------|--------|--------|
| 1️⃣ | Capture current schema from `/dev/graph-prototype` (ReactFlow state, node definitions, domain groups). | Codex | `/data/graph/oms_transformation.json` |
| 2️⃣ | Annotate which clusters already match the directive structure (OMS, MFCS, EBS, Commerce, Retail). | Codex + Agent Z | Visual/structural audit |
| 3️⃣ | Add **timeline bands** (FY26 → FY28) as background layers in ReactFlow to reflect Jesse’s phasing. | Dev | `/graph-prototype/components/timeline.tsx` |
| 4️⃣ | Connect **store metadata** from Ronald’s CSV into node props (region, brand). | Dev | `/graph-prototype/hooks/useStoreData.ts` |
| 5️⃣ | Verify ALE reasoning tags render correctly in node metadata inspector. | Fuxi Core | `/components/NodeInspector.tsx` |
| 6️⃣ | Commit working state → branch: `feature/d084c_oms_transformation_graph` | Codex | Git main → dev merge |

**Output Checkpoints:**
- ✅ Graph visually mirrors screenshot (Domain clusters + Guided Focus panel).
- ✅ Store-region overlays are toggleable.
- ✅ Temporal banding appears behind domains.
- ✅ ALE tags accessible via hover or side panel.
- ✅ EAgent narration placeholder active (“Exploring systems in this lens…”).

---

### ⚙️ Deliverable (Iteration 1)

- Merge Ralph’s *Current + Future State JSON Graphs*.
- Add *OMS Vendor Landscape* as transitional layer.
- Attach *store location metadata* to domain nodes.
- Sync *Jesse’s timeline bands* to Sequencer.
- Bind *D084A reasoning tags* for adaptive logic.

---

### 🧭 Next Iterations

1. **Iteration 2:** Animate phasing & system transitions (FY26–FY28).
2. **Iteration 3:** Introduce regional simulation and ROI overlays.
3. **Iteration 4:** Add EAgent narration and adaptive scenario exploration.
4. **Iteration 5:** Link ALE learning outcomes to predictive insights.

---

**Branch:** `feature/d084c_oms_transformation_graph`

**Approvers:** Fuxi Core, Agent Z (Bill), Codex

**Purpose:** Create the first end-to-end harmonized OMS modernization model — connecting architecture, sequencing, and learning into a single intelligent visualization.

