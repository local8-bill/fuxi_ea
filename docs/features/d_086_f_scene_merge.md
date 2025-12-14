## 🧹 Directive D086F – Scene Harness Decommission & Core Merge

### Objective
Retire `/dev/scene-transition-test` and merge the validated functional components (SceneManager, Telemetry Hook, Transition Orchestrator) directly into the live scene flow under the unified ExperienceShell.

**Current status:** Harness archived under `/app/dev/archive/scene-transition-harness/`, scene utilities promoted to `src/lib/scene/`, and ExperienceShell now drives Digital Twin → Sequence → ROI/TCC → Intelligence transitions through the shared orchestrator + telemetry hooks.

---

### 🔧 Actions for dx

#### 1. Archive Harness
- Move `/app/dev/scene-transition-test/` → `/app/dev/archive/scene-transition-harness/`.
- Update documentation to mark **D086E** as *superseded* by **D086F**.
- Remove all build/test references to the harness from `package.json` and `scripts/ui_diff_capture.sh`.

#### 2. Promote Core Components
Move the following from `/dev/scene-transition-test/core/` → `/src/lib/scene/`:
- `sceneManager.ts`
- `useSceneTelemetry.ts`
- `TransitionOrchestrator.tsx`

Wrap these into a single export namespace `scene` inside `/src/lib/scene/index.ts`.

Register `SceneManagerProvider` at the top level in `ExperienceShell.tsx` so all live scenes inherit the same context.

#### 3. Integrate into Live Flow
Embed `<TransitionOrchestrator />` inside the following scene routes:
- `/scenes/DigitalTwinScene.tsx`
- `/scenes/SequenceScene.tsx`
- `/scenes/RoiScene.tsx`
- `/scenes/IntelligenceScene.tsx`

Replace all mock navigation or button handlers (e.g., `onClick={setScene('sequence')}`) with:
```ts
import { useSceneManager } from "@/lib/scene/sceneManager";
const { setScene } = useSceneManager();
setScene('sequence');
```

This guarantees scene persistence and telemetry across transitions.

#### 4. Clean Out Redundancy
- Delete all duplicated focus/insight rails from the harness.
- Ensure the Shadcn layout + typography tokens apply consistently across all scenes.
- Verify that `UXShellLayout` still wraps the app but is not duplicated in dev routes.

#### 5. QA / Validation Steps
1. Launch app under `feature/086f_scene_merge`.
2. Perform the following transitions:
   - `Digital Twin → Sequence → ROI/TCC → Intelligence → Digital Twin`
3. Verify:
   - No layout flicker.
   - No console errors.
   - Telemetry events fire correctly for scene load/unload.
4. Confirm scene states persist (e.g., sequencer position, graph overlays, filters).

---

**Branch:** `feature/086f_scene_merge`  
**Dependencies:** D087F (Scene Template Refactor)  
**Deliverable:** Unified live scene transitions under ExperienceShell without relying on dev harness.

---

**Approvers:** Bill (Agent Z), dx  
**QA Target:** Friday build
