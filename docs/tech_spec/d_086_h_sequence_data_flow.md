## Directive D086H – Digital Twin → Sequencer Data Flow (Persistent ALE Context)

### 🎯 Objective
Simplify the user flow between **Digital Twin** and **Sequencer** while ensuring ALE (Adaptive Learning Engine) context is automatically available across all scenes.

---

### 🧭 Scene Flow Overview

1. **Input Scene (Data Uploads)**
   - User uploads: `current_state.csv` + `future_state.csv` (and optionally architecture diagrams).
   - System automatically harmonizes into a unified dataset via `/api/digital-enterprise/harmonize`.
   - Output saved as `enterprise_graph.json` (snapshot stored under `.fuxi/data/harmonized/`).

2. **Digital Twin Scene**
   - Displays the harmonized architecture as the **current ecosystem view**.
   - Data sourced from either:
     - **Live API:** `/api/digital-enterprise/view?mode=all`  
     - **Snapshot:** user-selected `.json` from harmonized output.
   - **Left Rail → DATA Section:**
     ```
     ▾ DATA
        • Load Live Data
        • Load Snapshot
     ```
   - Users can save the viewed Twin as a named snapshot:
     > _Save View → “Deckers OMS Current 2025”_

3. **Persistent ALE Context**
   - ALE automatically initializes per workspace (`workspace_id: digital_enterprise`).
   - No manual loading required.
   - On mount:
     ```ts
     const context = await fetch(`/api/ale/context?workspace=${workspaceId}`);
     contextStore.initialize(context);
     ```
   - Context includes:
     ```json
     {
       "roi_signals": {...},
       "tcc_signals": {...},
       "readiness": {...},
       "previous_sequences": [...]
     }
     ```
   - Refresh schedule: 12-hour interval or after significant data ingestion.
   - Persisted in `/lib/ale/contextStore.ts` for reuse by all scenes.

4. **Build a Sequence (Transition)**
   - User selects: **Build a Sequence** → dialogue input appears.
   - Example input:
     > “Replace OMS globally by 2029.”
   - Fuxi parses intent → analyzes uploaded architecture → generates sequence scaffolding.
   - Transition animation from Twin → Sequencer scene.

5. **Sequencer Scene**
   - Uses the same harmonized data and ALE context.
   - Visualizes systems, domains, and integration phases according to generated sequence.
   - ALE updates confidence and ROI/TCC metrics in real time as the user modifies sequence parameters.

---

### ⚙️ Technical Notes

| Component | Function | Persistence |
|------------|-----------|-------------|
| **/api/digital-enterprise/view** | Provides harmonized architecture graph | API-driven (live) |
| **/api/ale/context** | Provides reasoning/learning context | Auto-attached on workspace load |
| **/lib/ale/contextStore.ts** | Persists context for re-use | Local storage / memory cache |
| **DigitalTwin.tsx** | Scene logic for visualization + transitions | Persistent via contextStore |

---

### 🧑‍💻 Developer Setup Checklist

1. **Create Context Store**  (`/lib/ale/contextStore.ts`):
   ```ts
   import { useState, useEffect } from 'react';

   export const contextStore = {
     data: null,
     async initialize(ctx) {
       this.data = ctx;
       localStorage.setItem('ale_context', JSON.stringify(ctx));
     },
     async load() {
       const cached = localStorage.getItem('ale_context');
       if (cached) this.data = JSON.parse(cached);
       return this.data;
     },
     get() {
       return this.data;
     }
   };
   ```

2. **Attach on Workspace Mount** (in `ExperienceShell.tsx`):
   ```ts
   useEffect(() => {
     async function initALE() {
       const workspaceId = 'digital_enterprise';
       const res = await fetch(`/api/ale/context?workspace=${workspaceId}`);
       const data = await res.json();
       await contextStore.initialize(data);
     }
     initALE();
   }, []);
   ```

3. **Auto-Refresh Every 12 Hours:**
   ```ts
   useEffect(() => {
     const refreshInterval = setInterval(async () => {
       const res = await fetch(`/api/ale/context?workspace=digital_enterprise`);
       const data = await res.json();
       await contextStore.initialize(data);
     }, 1000 * 60 * 60 * 12);
     return () => clearInterval(refreshInterval);
   }, []);
   ```

4. **Provide Hook to Access Context:**
   ```ts
   export function useALEContext() {
     const [ctx, setCtx] = useState(contextStore.get());
     useEffect(() => {
       if (!ctx) setCtx(contextStore.get());
     }, [ctx]);
     return ctx;
   }
   ```

5. **Call `useALEContext()`** in any scene (Digital Twin, Sequencer, etc.) to access shared context.

---

### 💡 User Experience Summary
- **No redundant toggles** – ALE context is always on.
- **Graph-first experience** – Digital Twin presents what exists, Sequencer models what’s next.
- **Data confidence stays live** – ALE continuously evaluates readiness, ROI, and TCC.

---

### ✅ Completion Criteria
- Left nav simplified to only `Load Live Data` and `Load Snapshot`.
- Persistent ALE context initialized and cached automatically.
- Dialogue-driven sequence creation live in Digital Twin scene.
- Smooth transition from Digital Twin → Sequencer scene.
- Verified synchronization of harmonized graph, ALE signals, and sequence data.

**Branch:** `feature/d086h_sequence_data_flow`

**Approvers:** Agent Z (Bill), dx

