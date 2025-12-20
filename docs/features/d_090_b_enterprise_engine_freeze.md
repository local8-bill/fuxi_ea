## **D090B — Enterprise Engine Architectural Freeze (Revised)**

### 🎯 **Purpose**

This directive marks the **Enterprise Engine v1.0 Architectural Freeze**, establishing the Sequencer Scene, UnifiedShell, and ALE Context as the stable core runtime for all future development.

The goal is to **lock the system at a known-good state** — stable layout, unified theming, dynamic data loading, and ALE integration — before expanding functionality or integrating additional datasets (e.g., Deckers Store Locations).

---

### **1. Core Framework Hierarchy**

```
UnifiedShell (global frame — top nav, theme context)
│
└── SceneTemplate (parent layout — rails, spacing, data binding)
    │
    ├── DigitalTwinScene        (migrated, inherits SceneTemplate)
    ├── SequencerScene          (migrated, inherits SceneTemplate)
    ├── OnboardingScene         (planned inheritance)
    ├── IntelligenceScene       (planned inheritance)
    └── ROIAnalysisScene        (planned inheritance)
```

#### **UnifiedShell**
- Global theme controller (light baseline, shadcn UI components)
- Top nav: left-justified title (“Fuxi Enterprise Engine”), right-justified global icons
- Persistent across all scenes

#### **SceneTemplate**
- Manages **Left / Right Rails** (collapsible, scene-driven)
- Handles responsive sizing of the graph canvas
- Maintains ALE context hydration and telemetry sync

#### **SequencerScene (Core Runtime)**
- Acts as **parent template for future scenes**
- Loads sequence data dynamically from `/src/data/sequences/` using `index.json` as registry
- Displays timeline bands (FY26–FY28 default)
- Supports scenario switching and ALE-driven highlights
- Confirmed as baseline for production UX and data flow

---

### **2. Verified Runtime Components**

| Component | Status | Notes |
|------------|---------|-------|
| **UnifiedShell** | ✅ Stable | Fully unified theme + layout imported globally |
| **Left / Right Rails** | ✅ Stable | Collapsible, consistent across scenes |
| **DigitalTwinScene** | ✅ Stable | Snapshot + Live data load verified |
| **SequencerScene** | ✅ Stable | Dynamic JSON sequence load working via `/src/data/sequences/index.json` |
| **GraphCanvas** | ✅ Refined | Padding + spacing corrected; no overlap |
| **ALE Context** | ✅ Connected | Context store live, refresh 12h |
| **Telemetry** | ⚙️ Throttled | Batched to prevent dev spam |
| **Theme** | ✅ Unified | Light baseline (no graphite legacy) |

---

### **3. Data Flow (Frozen Model)**

```
Upload / Snapshot → DigitalTwinScene
         ↓
   Harmonized Graph (JSON + ALE Context)
         ↓
   Build Sequence → SequencerScene
         ↓
   Active ALE Context (ROI/TCC/Readiness)
         ↓
   Sequencer Visualization (FY Bands)
```

> Sequencer reads sequences authored under `/src/data/sequences/` **plus optional intent payloads from `sessionStorage`** (created when the user builds a sequence from Digital Twin).

All data interchange uses shared JSON payloads and ALE context hydration; no direct dependency between scenes. The Sequencer now serves as the core data consumer.

---

### **4. Post-Freeze Integration Rules**

1. **No new CSS themes** — all future styling via the unified shadcn/tailwind system.
2. **All scenes inherit SceneTemplate.** Direct DOM structure changes at the scene level are prohibited.
3. **New data sources** (e.g., Deckers Store Locations) must load via `/src/data/` or an API route and bind through the ALE context store.
4. **Legacy components** (GraphPredictivePanel, LegacyNavSection, etc.) are fully deprecated — any usage triggers removal.
5. **No additional telemetry points** may be added until batching is validated.
6. **Verification Gate:** `npm run lint && npm run build` must pass with 0 errors. Manual smoke tests for `/project/{id}/experience?scene=digital` and `/project/{id}/experience?scene=sequencer` must both load successfully before freeze confirmation.

---

### **5. Version Tag & Documentation**

- **Version:** `v1.0.0 (D090B — Engine Core Freeze)`
- **Baseline Branch:** `feature/d090b_engine_freeze`
- **Docs Snapshot:** `/docs/features/d_090_b_enterprise_engine_freeze.md`
- **Next Step:** D091 — Data Lens Expansion (Store Locations, Org Readiness)

---

### **6. Summary**

✅ UnifiedShell confirmed as global container  
✅ SequencerScene validated as parent runtime  
✅ Graph + ALE context stabilized  
✅ DigitalTwinScene harmonized and load verified  
✅ Theming unified under a single light baseline  
✅ Verification gates established  

**→ Fuxi Enterprise Engine v1.0 is now the frozen architectural baseline.**  
All future work (visualizations, analytics, data models) will build from this structure.