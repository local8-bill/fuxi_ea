## Directive D086E – Scene Transition Build Components

> **Status:** Superseded by D086F (Scene harness merged into ExperienceShell). Use this doc for historical reference only.

### 🎯 Objective
Develop the foundational components required to execute and validate **scene transitions** defined in D086D. These components create the infrastructure for smooth, telemetry-aware movement between scenes while preserving state, context, and UI fidelity.

---

### 🧩 Component Breakdown

#### 1. **SceneManager Controller**
Manages global scene state and transitions between key views.
```ts
// src/lib/sceneManager.ts
export const useSceneManager = create((set) => ({
  activeScene: "digitalTwin",
  setScene: (scene: SceneType) => set({ activeScene: scene }),
}));
```
- Exports `useSceneManager()` hook for all scene components.
- Logs transitions via ALE telemetry.

---

#### 2. **Scene Container Components**
Each major view is modularized for independent development and testing.

| Scene | Path | Core Elements |
|--------|------|----------------|
| Digital Twin | `src/scenes/DigitalTwinScene.tsx` | GraphCanvas, FocusRail, “Simulate Sequence” CTA |
| Sequence | `src/scenes/SequenceScene.tsx` | SequencerGraph, TimelineRail, “Evaluate ROI/TCC” CTA |
| ROI/TCC | `src/scenes/RoiScene.tsx` | SummaryPanel, MetricCards, “Generate Intelligence” CTA |
| Intelligence | `src/scenes/IntelligenceScene.tsx` | Org Intelligence Report, “Return to Ecosystem” CTA |

Each component calls `useSceneManager().setScene()` to trigger transitions.

---

#### 3. **Transition Orchestrator**
Handles fade/slide animations using Framer Motion.
```tsx
<motion.div
  key={activeScene}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.3 }}
>
  {renderScene(activeScene)}
</motion.div>
```
- Prevents flicker during load.
- Ensures consistent user context through transitions.

---

#### 4. **Telemetry Hook**
Automatically logs scene transitions.
```ts
import { recordTelemetry } from "@/lib/telemetry";

export function useSceneTelemetry(scene: string) {
  useEffect(() => {
    recordTelemetry({
      workspace_id: "digital_enterprise",
      event_type: "scene_change",
      data: { scene, timestamp: Date.now() },
    });
  }, [scene]);
}
```
- Used in every scene component.
- Outputs data for D086D verification.

---

#### 5. **Performance Tracker (Dev Only)**
Tracks render and transition performance in development mode.
```ts
// src/hooks/usePerformanceTracker.ts
export const usePerformanceTracker = (label: string) => {
  const start = performance.now();
  useEffect(() => {
    const end = performance.now();
    console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
  }, []);
};
```
- Used by QA testers to benchmark scene performance.

---

#### 6. **QA Test Harness**
Accessible route for running manual scene transition tests.
```tsx
<Button onClick={() => setScene("sequence")}>Next Scene</Button>
<Button onClick={() => setScene("digitalTwin")}>Reset</Button>
```
- Route: `/dev/scene-transition-test`
- Displays active scene and telemetry logs.

---

### ⚙️ Integration Notes
- Do **not** use legacy UXShell components.
- All UI to use **Shadcn layout primitives**.
- Confirm proper ALE integration for `scene_change` telemetry.
- Scene state persisted via `digitalEnterpriseStore`.

---

### 🧱 Developer Setup Checklist
1. **Branch Prep**  
   - Checkout: `feature/086e_scene_transition_build`  
   - Rebase from: `feature/ux-template_refactor`
   - Confirm latest Shadcn components are installed.

2. **Dependencies**  
   ```bash
   npm install framer-motion zustand
   npm install @shadcn/ui
   ```

3. **Folder Structure**
   ```bash
   src/
   ├── lib/sceneManager.ts
   ├── hooks/
   │   ├── usePerformanceTracker.ts
   │   └── useSceneTelemetry.ts
   ├── scenes/
   │   ├── DigitalTwinScene.tsx
   │   ├── SequenceScene.tsx
   │   ├── RoiScene.tsx
   │   └── IntelligenceScene.tsx
   └── app/dev/scene-transition-test/
       └── page.tsx
   ```

4. **Build & Run**  
   ```bash
   npm run dev
   open http://localhost:3000/dev/scene-transition-test
   ```

5. **Verification**  
   - Ensure all transitions work without full re-render.  
   - ALE logs appear in console.  
   - FPS and render time printed via performance tracker.

---

### 🧭 Wireframe Overview

#### Digital Twin Scene
```
┌──────────────────────────────────────────────┐
│  Header: Project | Scene | Mode              │
├──────────────────────────────────────────────┤
│ [Left Rail - Focus]   |   [Graph Canvas]    | [Right Rail - Options]
│ Systems / Domains     |   Digital Graph     |  Build Sequence ▸       
│                      |   (Interactive)      |  Harmonize Stack ▸      
│                      |                     |  Add View ▸             
└──────────────────────────────────────────────┘
```

#### Sequence Scene
```
┌──────────────────────────────────────────────┐
│  Header: Scenario | Phases | ROI/TCC         │
├──────────────────────────────────────────────┤
│ [Left Rail - Phases] | [Sequencer Canvas] | [Right Rail - Insights]
│ FY26 / FY27 / FY28   |  Systems Timeline  |  Metrics ▸ ROI/TCC ▸   
│                      |  Integrations Map  |  Recommendations ▸      
└──────────────────────────────────────────────┘
```

#### ROI/TCC Scene
```
┌──────────────────────────────────────────────┐
│  Header: ROI Analysis | Compare Scenarios    │
├──────────────────────────────────────────────┤
│ [Summary Cards]  [Chart Visualizations] [Next Steps]
│ ROI %, TCC Δ, Cost Curve | Stacked Bar Chart |  Generate Intelligence ▸ 
└──────────────────────────────────────────────┘
```

#### Intelligence Scene
```
┌──────────────────────────────────────────────┐
│  Header: Insights | Reports | Recommendations│
├──────────────────────────────────────────────┤
│ [Org Insights] | [Readiness Index] | [Return to Ecosystem ▸]
│ Behavioral / Structural Trends | Predictions | Action Items ▸          
└──────────────────────────────────────────────┘
```

---

### 📋 Completion Criteria
- [ ] SceneManager functional and globally accessible.
- [ ] All four scenes implemented as isolated components.
- [ ] Transitions visually smooth with no re-renders or flicker.
- [ ] Telemetry and performance hooks verified.
- [ ] `/dev/scene-transition-test` route operational.
- [ ] QA confirmation from Agent Z (Bill) and dx.

**Branch:** `feature/086e_scene_transition_build`  
**Dependencies:** D086D (Scene Transition Test Plan), D087F (Scene Template Refactor)
