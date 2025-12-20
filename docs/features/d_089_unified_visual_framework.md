## **D089L Implementation Plan — Digital + Sequencer Unification**

---

### **Objective:**

Unify the **Digital Twin** and **Sequencer** scenes under one consistent white theme and layout, then promote **Sequencer** as the parent template for all future scenes.

---

## 🧩 **Phase 1 — D089K: Digital Twin Stabilization**

**Goal:** Get `/project/[id]/experience?scene=digital` running perfectly inside `UnifiedShell`, matching Sequencer’s theme, and eliminate legacy components.

### ✅ 1. Layout and Shell Integration

- Remove all instances of legacy shells:
  - `ExperienceShell`
  - `UXShellLayout`
  - Any `graph-prototype` or `/dev/graph` imports.
- Ensure Digital uses only:
  ```tsx
  <UnifiedShell>
    <DigitalTwinScene />
  </UnifiedShell>
  ```
  No nested wrappers allowed.

### ✅ 2. Rails and Layout

- Replace legacy rails with shared components:
  ```
  src/components/layout/rails/LeftRail.tsx
  src/components/layout/rails/RightRail.tsx
  ```
- Remove:
  - `GraphRailLeft.tsx`
  - `GraphRailRight.tsx`
  - Rail logic inside `DigitalEnterpriseClient`.
- Confirm both rails collapse smoothly with the shared `useRailState()` hook.

### ✅ 3. Theme and Visuals

- Global background: `bg-white text-slate-900`.
- Use only `border-slate-200` for dividers.
- Delete legacy theme assets:
  - `theme-graphite.css`
  - `xy-theme.css`
  - Entire `src/components/uxshell/` directory.
- Top bar must display:
  - Left: Hamburger + “Fuxi · Enterprise Engine”
  - Right: Lucide icons (Layers, Workflow, BarChart2)

### ✅ 4. Functional Checks

- Graph data loads (live or snapshot).
- No duplicated or nested rails.
- No layout flicker or scroll anomalies.
- Top bar remains static during navigation.

### ✅ 5. Verification Criteria

Digital is stable when:

- It runs under UnifiedShell.
- Matches Sequencer’s theme and spacing exactly.
- Rails collapse/expand cleanly.
- No graphite remnants or duplicate CSS warnings.

---

## ⚡ **Phase 2 — D089L: Sequencer as Canonical Template**

**Goal:** Promote `SequencerScene` to serve as the parent template for all scenes (Digital, ROI, Intelligence) for consistent layout and behavior.

### ✅ 1. Move Sequencer to Parent Role

In `ExperienceClient.tsx`:

```tsx
<UnifiedShell>
  <SequencerScene isTemplate>
    {scene === "digital" && <DigitalTwinScene />}
    {scene === "roi" && <ROIScene />}
    {scene === "intelligence" && <IntelligenceScene />}
  </SequencerScene>
</UnifiedShell>
```

Add prop `isTemplate` to disable animations when Sequencer acts as a wrapper.

### ✅ 2. Apply Shared Layout Constants

- Import Sequencer layout constants:
  ```tsx
  const LAYOUT = { padding: 24, gap: 16 };
  ```
- Replace Digital’s hard-coded paddings and gaps with shared values.

### ✅ 3. Scene Consistency Test

- Seamless transitions between Digital, Sequencer, ROI, Intelligence.
- No theme or layout shift.
- Collapsible rails function independently without moving the top bar.

### ✅ 4. Documentation and Lockdown

- Tag release: `v0.9.0-UX-UNIFIED`.
- Add `/docs/features/d_089_l_unified_shell.md` documenting:
  - UnifiedShell structure
  - Shared spacing & theme tokens
  - Scene orchestration pattern

### ✅ 5. Success Definition

> All scenes use one shell, one theme, and one layout. Sequencer defines the master layout. Digital and all others inherit it. Legacy shells, dark themes, and ghosts are permanently removed.

---

**Outcome:** The **Sequencer Scene** becomes the canonical UI template for Fuxi’s experience architecture — a unified, scalable framework powering all future visual scenes.

---

## 🧠 **VII – Graph Refactor & Cleanup (Addendum)**

**Goal:** Ensure the Digital Twin and Sequencer scenes both render graphs through the unified data pipeline, eliminating legacy graph code and ghosted logic.

### ✅ 1. Data Ownership

- Centralize graph data fetching into `src/features/graph/useGraphData.ts`.
- Implement a reusable hook:
  ```tsx
  export function useGraphData(projectId: string) {
    const [data, setData] = useState<GraphData | null>(null);
    useEffect(() => {
      fetch(`/api/digital-enterprise/view?project=${projectId}`)
        .then(res => res.json())
        .then(setData)
        .catch(() => setData(null));
    }, [projectId]);
    return data;
  }
  ```
- Remove all fetch logic from `DigitalEnterpriseClient.tsx`.

### ✅ 2. GraphCanvas Detachment

- Import `GraphCanvas` directly inside `DigitalTwinScene` and `SequencerScene`.
- Bind props from `useGraphData()` or global graph store:
  ```tsx
  <GraphCanvas
    nodes={graphData?.nodes ?? []}
    edges={graphData?.edges ?? []}
    projectId={projectId}
  />
  ```
- Remove graph state initialization from DigitalEnterpriseClient.

### ✅ 3. Legacy Cleanup

- Hard delete obsolete graph UI logic:
  ```
  src/components/graph/GraphRailLeft.tsx
  src/components/graph/GraphRailRight.tsx
  src/components/graph/GraphControls.tsx
  src/components/graph/GraphLayoutSection.tsx
  src/components/graph/GraphSimulationControls.tsx
  ```

### ✅ 4. Graph State Hook

- Create `useGraphStore.ts` (Zustand or Context):
  ```tsx
  const useGraphStore = create((set) => ({
    zoom: 1,
    stage: "orientation",
    setStage: (stage) => set({ stage }),
  }));
  ```
- Both DigitalTwinScene and SequencerScene use the same store to persist zoom, stage, and filters.

### ✅ 5. Verification

- GraphCanvas loads without `DigitalEnterpriseClient` dependencies.
- Only one API call to `/api/digital-enterprise/view` per scene load.
- No references to legacy directives (`d_086_*`, `graph-prototype`, `Focus Lens`).
- Graph visually consistent with unified white theme.

> Once completed, the Graph is fully modular, independent of legacy shells, and reusable across all Fuxi visual experiences.
