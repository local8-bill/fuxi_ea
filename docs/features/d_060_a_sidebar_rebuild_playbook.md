## 🧭 D060A Sidebar Rebuild Playbook (Break-Glass Spec)

**Context:** This document codifies the _exact_ implementation for the Unified UXShell sidebar (Projects / Views / Modes). If the component ever drifts from spec, rebuild it from here. It merges D060A, D060B, and the D060A-L1 lockdown directives into a single remediation guide.

---

### 1. Purpose
- Preserve the canonical, demo-approved chevron sidebar.
- Provide a single source of truth for structure, styling, state, telemetry, and tests.
- Prevent regressions such as pills in Modes, extra badges, or non-approved icons.

---

### 2. Canonical Layout

```
▾ PROJECTS
   700am — Core
   951pm — Pilot
   Demo Workspace
   + New Project

▾ VIEWS
   ▾ Σ ROI
      ROI 1 (Hypothesis)
      ROI 2 (Actuals)
      ROI 3 (Scenario B)
      + New ROI

   ▸ + Graph
   ▸ ⇄ Sequencer
   ▸ ✓ Review
   ▸ ∞ Digital Enterprise

▾ MODES
   Architect
   Analyst
   CFO
   FP&A
   CIO
```

**Non-negotiables**
- Width fixed at `240px`.
- Section headings uppercase, 12px, tracking `0.2em`.
- Items use 12px Inter, 18px line height, left accent rail.
- Icons must be the math glyphs listed above—no emojis, Lucide, or color fills.
- No status tags (`LIVE`, `DRAFT`, etc.) and no pill buttons, chips, or badges anywhere in the sidebar.

---

### 3. Component Architecture

| Layer | Responsibility | File |
|-------|----------------|------|
| `Sidebar.tsx` | Composes Projects, Views, Modes; delegates routing & mode switching. | `src/components/uxshell/Sidebar.tsx` |
| `NavSection.tsx` | Renders a chevron button and collapsible body. | `src/components/uxshell/NavSection.tsx` |
| `useChevronNav.ts` | Stores expanded section + active item across reloads; emits telemetry. | `src/hooks/useChevronNav.ts` |
| `telemetry.ts` | Wrapper for `emitTelemetry`. | `src/components/uxshell/telemetry.ts` |

**Implementation Notes**
1. `Sidebar.tsx` owns the static data for projects, ROI entries, and shortcuts. Treat it as constants.
2. `NavSection` controls the chevron visual—never replace with Disclosure/ListBox.
3. The ROI sub-tree toggles independently via `toggleRoi`, but still respects the single-expanded rule for top-level sections.
4. Modes are plain `NavItem` rows—`variant="pill"` must not exist in this component again.
5. Routing uses `pushWithContext(router, href, { from, targetView })` so context resumes correctly.

---

### 4. Styling Contract

- **Container:** `.uxshell-sidebar` uses Tailwind `border-r border-black/5 overflow-y-auto p-3 bg-white`.
- **Sections:** `flex items-center gap-2 rounded-lg px-1 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500`.
- **Items:** `group relative flex w-full items-center justify-between rounded-lg px-3 py-[6px] text-[12px] leading-[18px] transition-colors`.
  - Active: `bg-neutral-900 font-semibold text-white`.
  - Rest: `text-slate-700 hover:bg-neutral-100`.
  - Accent rail: absolutely positioned `2px` strip on the left; white when active, neutral-400 on hover.
- **Spacing:** 12px between rows (`space-y-1`) and 24px between sections (applied via `gap-6` in container).
- **Animation:** rely on CSS transition in `useChevronNav` (150ms).
- **Accessibility:** Buttons must include `aria-expanded` on section toggles.

---

### 5. State & Persistence

```ts
interface ChevronNavState {
  expandedMain: "Projects" | "Views" | "Modes";
  roiExpanded: boolean;
  activeItem: string | null;
}
```

- Storage key: `sidebar_<projectId>_collapsed`.
- Persist on toggle + item select via `localStorage`.
- Restore in `useEffect` on mount; emit `nav_state_restored` with `{ projectId, expandedMain, activeItem }`.
- Selection logic:
  1. Clicking a selected item scrolls to top and re-emits `nav_item_selected` with `action: "scroll_top"`.
  2. Clicking a new item emits `nav_item_selected` and pushes route.
  3. Mode selection uses `onModeChange` callback (for `UnifiedLayout`) and emits `uxshell_mode_changed`.

---

### 6. Telemetry Matrix

| Event | Trigger | Payload |
|-------|---------|---------|
| `nav_section_toggled` | User expands/collapses Projects/Views/Modes. | `{ projectId, section, isExpanded }` |
| `nav_section_opened` | Section becomes the single expanded top-level. | `{ projectId, section }` |
| `nav_item_selected` | Any leaf item click. | `{ projectId, section, item, targetView?, action }` |
| `nav_mode_selected` | Mode row click. | `{ projectId, mode }` |
| `nav_state_restored` | `useChevronNav` rehydrates state. | `{ projectId, expandedMain, activeItem }` |

Telemetry helper lives in `src/components/uxshell/telemetry.ts` and should call `/lib/telemetry/navigation.ts`.

---

### 7. Acceptance Tests

1. **Playwright (`tests/e2e/nav.spec.ts` & `tests/e2e/uxshell-sidebar.spec.ts`):**
   - Projects, Views, Modes render with chevrons.
   - ROI submenu collapses/expands.
   - Modes render as list rows, not pills.
   - Only one section expanded at a time.
   - Local storage retains expansion state after reload (`page.reload()`).
2. **Unit Integration (optional):**
   - `useChevronNav.test.ts` ensures persistence keys and telemetry invocation.
3. **Visual QA:**
   - Sidebar width exactly 240px (assert via `expect(await sidebar.evaluate((el) => el.offsetWidth)).toBe(240)`).
   - No status labels or pills present.

---

### 8. Regression Guardrails

- **Lint Rule:** Add `// D060A-L1 Locked` comment block at top of `Sidebar.tsx`; changes require explicit approval.
- **Snapshot:** Capture a Percy (or equivalent) snapshot of the sidebar to compare future PRs.
- **Docs Link:** References: `docs/features/d_060_a_uxshell_sidebar_spec.md`, `docs/features/d_060_b_contextual_navigation_standard.md`, `scripts/d_060_a_lockdown_addendum.md`.

---

### 9. Restoration Checklist

1. Delete the existing sidebar implementation (if corrupted).
2. Re-copy the constants & structure from this doc.
3. Rebuild `NavSection` / `NavItem` to match styling contract.
4. Wire up `useChevronNav` with the defined persistence + telemetry schema.
5. Run `npm run lint`, `npm run test:unit` (if available), and `npx playwright test tests/e2e/nav.spec.ts`.
6. Capture screenshots for verification.

> Once restored, re-affirm compliance with D060A-L1: no pills, no badges, no icon changes.

---

### 10. Contacts
- **Directive Owner:** Bill Maynard
- **Implementation Steward:** Codex Agent
- **Escalation:** `#uxshell-war-room`

This playbook becomes the baseline for any future rebuild. Deviations require a formal directive update.
