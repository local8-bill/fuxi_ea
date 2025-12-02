## Directive D045 — Focus System Definition & Context Routing

### Summary

This directive introduces the **Focus System model** — allowing architects to explicitly define the systems or platforms under consideration for transformation. It shifts the user experience from broad inventory management to targeted hypothesis testing, enabling Fuxi to contextualize dependencies, sequencing, and ROI around user-declared system anchors.

---

### Goals

- Enable users to identify and declare their **Focus Systems** (the few that matter most).
- Dynamically filter large inventories (hundreds of systems) into relevant context views.
- Route users automatically to the appropriate workspace based on artifact availability and focus selection.
- Provide the foundation for AI-driven impact, sequencing, and ROI modeling (D046–D048).

---

### Context

Enterprise architects rarely start by asking, *"What systems exist?"* — they start by asking, *"What happens if I change this one?"*  
This directive formalizes that reality by adding intent capture and context filtering to the harmonization and transformation workflows.

---

### Features

#### 1. **Focus System Selection (User Intent Capture)**

- Add a `FocusSelector` component to both `/transformation-dialogue` and `/harmonization-review` pages.
- UI: multi-select dropdown listing all harmonized systems (searchable, paginated).
- Persist selection in project scope via new endpoint:

  ```ts
  POST /api/projects/focus
  {
    projectId: string,
    focusSystems: string[]
  }
  ```

- Stored in `.fuxi/data/projects/<projectId>/focus.json`:
  ```json
  {
    "projectId": "700am",
    "focusSystems": ["ERP", "OMS"]
  }
  ```

- Telemetry events:
  - `focus_system_selected` (per selection)
  - `focus_scope_confirmed` (when user confirms focus list)

---

#### 2. **Context Filtering (Graph & List Reduction)**

- Once focus systems are declared, all visual and tabular data will filter dynamically:
  - Harmonization view → show only rows connected to focus systems (directly or via dependency).
  - Ecosystem (DE) view → show focus systems + 1 upstream/downstream hop.
  - Transformation dialogue → restrict scope to focus systems + dependent subsystems.
- Add a toggle: **"Show full inventory / Show focus scope"**.
- Edge weights and colors persist; isolate non-relevant systems to faded background state.

---

#### 3. **Smart Project Flow Routing (Artifact + Intent Detection)**

Integrate a new `detectNextStep()` utility in `src/domain/services/projectFlow.ts`:

```ts
export function detectNextStep(projectId: string): "sequencer" | "harmonization" | "ecosystem" | "upload" {
  const ingested = listFiles(`.fuxi/data/ingested/${projectId}`);
  const hasInventory = ingested.some(f => f.includes("inventory"));
  const hasCurrent = ingested.some(f => f.includes("current_state"));
  const hasFuture = ingested.some(f => f.includes("future_state"));

  if (hasCurrent && hasFuture && hasInventory) return "ecosystem";
  if (hasCurrent && hasFuture) return "harmonization";
  if (hasInventory) return "sequencer";
  return "upload";
}
```

- On new artifact upload or project creation, this function determines which workspace to open next automatically.

---

#### 4. **Adaptive Guidance Layer (AI-ready placeholder)**

While AI inference is deferred to D046+, this directive preps placeholders for:

- `suggested_focus_systems` (based on dependencies, duplication, or recent harmonization changes).
- UI prompt: *“You appear to be evaluating your Order Management stack — would you like to include OMS, WMS, and ERP in your focus scope?”*
- Future hook: `/api/ai/focus-suggestions` (returns ranked systems for consideration).

---

### Success Criteria

- ✅ User can declare and persist focus systems.
- ✅ Project routes correctly based on available artifacts and focus scope.
- ✅ Harmonization, transformation, and ecosystem views respect focus filtering.
- ✅ Telemetry captures all focus-related actions.
- ⚙️ Placeholder exists for future AI assistance (D046).

---

### Dependencies

- D036 — Unified Project Flow Middleware
- D037 — Graph Visual Consistency (domain overlays, edge filtering)
- D043A — Timeline/Stage Hooks (integration point for focus-based ROI sequencing)

---

### Next Steps

- Implement `FocusSelector` and persistence endpoints.
- Integrate focus filtering logic into Harmonization and Ecosystem pages.
- Update Verification Dashboard to reflect selected focus systems.
- Prepare for D046 — **Impact Scope & ROI Inference Engine.**

