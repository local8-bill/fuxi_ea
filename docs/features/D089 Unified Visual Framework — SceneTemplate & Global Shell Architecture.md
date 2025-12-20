## **D089 Unified Visual Framework — SceneTemplate & Global Shell Architecture**

---

### **Objective**

Create a universal layout system for all Fuxi experience scenes using a single global shell (`UnifiedShell`) and a shared scene layout (`SceneTemplate`). Sequencer inspired the pattern, but `SceneTemplate` becomes the canonical parent layout for all scenes.

---

### **🧭 Architectural Overview**

```
UnifiedShell  (Global frame — top bar, global theme, navigation)
│
└── SceneTemplate  (Parent layout — rails, spacing, theme, padding)
     ├── LeftRail     → Scene-specific controls
     ├── ViewPane     → Scene-specific visualization (graph, timeline, etc.)
     └── RightRail    → Scene-specific insights or tools
```

All scenes (Digital Twin, Sequencer, ROI, Intelligence, Onboarding) inherit this unified structure.

---

### **🎯 Core Principles**

#### 1. **Separation of Structure and Content**

`SceneTemplate` provides the *structure*, not the *logic* — scenes inject their own components.

```tsx
<SceneTemplate
  leftRail={<DigitalRail projectId={projectId} />}
  rightRail={<OptionMenu onAction={handleAction} />}
>
  <DigitalTwinGraph projectId={projectId} />
</SceneTemplate>
```

For Sequencer:

```tsx
<SceneTemplate
  leftRail={<SequenceNavigator />}
  rightRail={<SequenceMetrics />}
>
  <SequencerTimeline />
</SceneTemplate>
```

#### 2. **Unified Visual Identity**

- Theme: `bg-white text-slate-900`
- Borders: `border-slate-200`
- Padding: `24px`, Gap: `16px`
- Rails collapse via `useRailState()`

#### 3. **Dynamic Rails**

Rails are passed as props — scene-defined, but with consistent collapse behavior.

```tsx
export function SceneTemplate({ leftRail, rightRail, children }: Props) {
  const { leftCollapsed, rightCollapsed, toggleLeft, toggleRight } = useRailState();

  return (
    <div className="flex h-full bg-white text-slate-900">
      <Rail side="left" collapsed={leftCollapsed} onToggle={toggleLeft}>
        {leftRail}
      </Rail>

      <main className="flex-1 overflow-hidden p-6">
        {children}
      </main>

      <Rail side="right" collapsed={rightCollapsed} onToggle={toggleRight}>
        {rightRail}
      </Rail>
    </div>
  );
}
```

#### 4. **Scene Registration**

Scenes are registered in `ExperienceClient.tsx`:

```tsx
<UnifiedShell>
  {scene === "digital" && (
    <SceneTemplate leftRail={<DigitalRail />} rightRail={<OptionMenu />}>
      <DigitalTwinScene />
    </SceneTemplate>
  )}

  {scene === "sequencer" && (
    <SceneTemplate leftRail={<SequenceNavigator />} rightRail={<SequenceMetrics />}>
      <SequencerScene />
    </SceneTemplate>
  )}
</UnifiedShell>
```

---

### **📐 Layout Consistency Rules**

| Element          | Rule                                                   |
| ---------------- | ------------------------------------------------------ |
| Left/Right Rails | 280 px expanded, 48 px collapsed                       |
| Padding          | 24 px (Scene body)                                     |
| Gaps             | 16 px between content blocks                           |
| Top Bar          | Static; unaffected by rail collapse                    |
| Theme            | Global via `UnifiedShell` (white + slate palette)      |
| Collapse State   | Owned by `SceneTemplate`; child scenes cannot override |

---

### **🧩 Implementation Steps**

#### Phase 1 — Stabilize Digital Twin (D089K)

- Delete legacy shells: `ExperienceShell`, `UXShellLayout`, `graph-prototype`.
- Wrap DigitalTwinScene with `UnifiedShell + SceneTemplate`.
- Confirm theme + spacing parity with Sequencer.

#### Phase 2 — Promote SceneTemplate (D089L)

- Move `SequencerScene` to inherit `SceneTemplate`.
- Update `ExperienceClient` to orchestrate all scenes via `SceneTemplate`.
- Unify spacing and rail logic.

#### Phase 3 — Graph Integration (D089M)

- Centralize data fetch into `useGraphData(projectId)`.
- Mount `GraphCanvas` directly in scenes.
- Remove all legacy `GraphRail` and `GraphControls` components.

---

### **🎨 Outcome**

> Every scene in the Fuxi ecosystem shares one layout, one theme, and one structural pattern. `Sequencer` inspired it — `SceneTemplate` defines it.

```
UnifiedShell (Global theme)
│
└── SceneTemplate (Layout)
     ├── DigitalTwinScene
     ├── SequencerScene
     ├── ROIAnalysisScene
     ├── IntelligenceScene
     └── OnboardingScene
```

---

### **🔒 Success Definition**

- Legacy layouts deleted.
- All scenes unified in appearance and structure.
- Collapsible rails consistent and independent.
- Graph and Timeline views inherit identical theme context.

> Once complete, this becomes the global Fuxi Visual Framework, reusable in future apps and internal tooling.

