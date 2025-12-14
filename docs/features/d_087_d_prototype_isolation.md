## Directive D087D — Prototype Shell Rebind & Isolation

### 🎯 Objective
Fully decouple `/dev/graph-prototype` from the production `UXShellLayout` and shared graph state to eliminate cross-route bleed, layout ghosts, and theme inheritance issues.

---

### 🧩 Scope of Work

| Area | Problem | Action |
|------|----------|--------|
| **Layout Wrapper** | Prototype still inherits `UXShellLayout`, causing the live white header and top bar stack. | Replace wrapper with a lightweight local shell (`/src/app/dev/graph-prototype/Layout.tsx`) using `flex-row` for structure. Remove `ExperienceShell` import. |
| **Sidebar (NavSection)** | Legacy Org Intelligence accordion renders full domain list and overlays content. | Delete `NavSection` import. Replace with a compact `shadcn/ui` accordion (By Domain, By Goal, By Stage). Fixed width `w-[240px]`. |
| **Lane Behavior** | Sidebar uses `absolute` positioning; overlaps canvas. | Move sidebar into main flex container with `flex-shrink-0`. Main content expands naturally. |
| **Domain Data** | Prototype still renders full Org Intelligence list. | Limit domain list to sandbox data (e.g. Commerce, OMS, Finance). Stub only. |
| **Graph Canvas State** | Prototype and live Digital Twin share `useGraphState`. | Duplicate store as `/dev/hooks/usePrototypeGraphState.ts`. Prefix signals with `proto_` to isolate. |
| **Theme Provider** | Prototype reads from live theme context → wrong palette. | Wrap only prototype root with its own `ThemeProvider attribute="class" defaultTheme="zinc"`. |
| **Shared Imports** | Shared `GraphCanvas` + `NavSection` lead to style bleed. | Create local copies under `/dev/graph-prototype/components/`. Re-export primitives only (no hooks). |
| **Telemetry/Store Writes** | Prototype writes to live ALE telemetry logs. | Guard with `if (process.env.NODE_ENV === 'development')` before any telemetry event. |

---

### 🧱 Deliverables
1. `/src/app/dev/graph-prototype/Layout.tsx` (local, minimal shell)
2. `/src/hooks/usePrototypeGraphState.ts` (isolated store)
3. `/src/app/dev/graph-prototype/components/*` (sandbox-only UI copies)
4. Removal of all shared imports from prototype routes
5. Visual parity with Digital Twin layout, but **fully isolated**

---

### ✅ Acceptance Criteria
- Prototype runs standalone — no white header, no top bar, no UXShell.
- Sidebar fixed to 240px, collapsible but not overlaying content.
- Graph state no longer persists between prototype and live Digital Twin.
- Theme tokens scoped; no cross-environment bleed.
- ALE telemetry writes restricted to dev environment.

---

### 🧪 Test Checklist (post‑commit verification)
1. **Layout Isolation:** Load `/dev/graph-prototype` → confirm no top nav and fixed 240 px sidebar.
2. **State Separation:** Change node layout; switch to `/project/[id]/digital-enterprise` → ensure position changes are not carried over.
3. **Theme Containment:** Toggle between `zinc` and any other theme; verify it doesn’t affect live scenes.
4. **Telemetry Guard:** Inspect logs → confirm no harmonization or sequencer events written in production mode.
5. **Component Duplication:** Ensure `/dev/graph-prototype/components` and `/src/components` contain distinct files.
6. **Cross‑Directive Note:** Refer to **D076C – Theme Test Harness** for color and typography verification **but do not implement the harness in this branch**.

---

**Branch:** `feature/d087d_prototype_isolation`  
**Approver:** Bill / Agent Z  
**Assignee:** dx  
**Dependencies:** None (may be merged after OMS stabilization)

