## **D090 — Sequencer Data Integration & Visualization**  
*(Activate: Awesome Developer Mode)*

### 🎯 **Objective**
Integrate static modernization sequence data into the Sequencer scene, enabling dynamic loading, selection, and visualization of multiple modernization waves (e.g., OMS, EBS, Product Pipeline).

---

### **1. Developer Context: Awesome Developer Mode**
> You are building the core Sequencer engine that powers transformation planning for the Fuxi ecosystem. This implementation will serve as the parent framework for all future scene templates.
>
> 🧩 **Guidelines:**
> - Be opinionated: remove redundant or legacy code, prefer clean and declarative.
> - Prioritize maintainability and performance.
> - Use consistent class names, spacing, and component composition from SequencerScene.
> - Treat provided JSONs as production-grade data — no mockups.

---

### **2. Data Structure**
Store sequences in `/src/data/sequences/` as JSON files:

```
/src/data/sequences/
├── oms_modernization.json
├── ebs_reduction_sprint.json
├── product_pipeline_enhancement.json
└── index.json     ← registry of all sequences
```

Each file follows the unified schema:

```ts
{
  id: string;
  title: string;
  domains: string[];
  fyStart: string;
  fyEnd: string;
  roiTarget: number;
  tccTarget: number;
  readinessIndex: number;
  scenarios: {
    id: string;
    title: string;
    description: string;
    roiDelta: number;
    tccDelta: number;
    riskScore: number;
    readiness: number;
    aleSignals: string[];
  }[];
}
```

---

### **3. Integration Requirements**

#### **Left Rail:**
- Add a **sequence selector** populated dynamically from `index.json`.
- Default load: `OMS Modernization`.
- Selecting a new sequence dynamically imports its JSON.

#### **Right Rail:**
- Display scenario cards (title, ROI/TCC deltas, readiness bar, ALE tags).
- Clicking a scenario updates the active FY band and highlights related domains.

#### **Graph / Timeline:**
- Timeline bands auto-adjust to `fyStart` / `fyEnd`.
- Graph focus highlights domains listed in the `domains` array.

---

### **4. Data Sources Provided**
Use the prebuilt JSONs for initial population. These represent real modernization sequences:

- `oms_modernization.json` — **OMS Modernization** (FY26–FY28, dual-scenario rollout).
- `ebs_reduction_sprint.json` — **EBS Reduction Sprint** (FY27–FY28, modular vs. consolidated path).
- `product_pipeline_enhancement.json` — **Product Pipeline Enhancement** (FY26–FY27, PIM-first vs. PLM full replacement).

An `index.json` file registers all three for the left-rail selector.

---

### **5. Deliverables**
- Sequencer loads and visualizes all sequences dynamically.
- Static JSONs serve as canonical data (until ALE integration).
- Schema validated and reusable for future sequence authoring.
- Scene layout and theme consistent with global `SceneTemplate`.

---

> 🎯 **Outcome:**  
> The Sequencer becomes the data-driven, template parent for all Fuxi visualizations — enabling transformation modeling, scenario comparison, and ROI/TCC simulation across the entire enterprise architecture.