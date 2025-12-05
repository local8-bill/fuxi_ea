# UXShell Design – v0.6.12 Hotfix

## Purpose
- Provide a stable, GPT-style shell that keeps the left nav fixed, the content flowing, and avoids layout drift.
- Centralize navigation (global icon bar), sidebar, main stage, and optional insights rail under a predictable grid.
- Ensure telemetry hooks remain intact for layout/view interactions.

## Layout Structure
- **GlobalNav (top bar)**
  - Icons: Home ⌂, Graph ∞, ROI Σ, Sequencer ⇄, Digital Enterprise ◆.
  - Hamburger button at left; brand “Fuxi · Enterprise Engine”.
  - Active state highlights; compact 9x9 buttons.
- **UXShellLayout (grid)**
  - Columns: `280px` sidebar + `1fr` content (responsive 260/240 on narrower viewports).
  - `.uxshell-sidebar`: locked width, scrollable, border-right, light bg.
  - `.uxshell-content`: scrollable, tightened padding (p-4), light gradient background from `uxshell-root`.
- **Sidebar**
  - Sections: Projects, Views, Modes; collapsible via `NavSection`.
  - Paths use `/project/<id>/…`; active state and telemetry via `useChevronNav`.
  - Icons match nav semantics (Σ, ⇄, etc.).
- **Content Column**
  - Main embed card (Graph/ROI/Sequencer/Review) with minimal padding.
  - Command Deck sits below in its own card with the prompt bar and “Open view” CTA.
  - Metrics row removed (avoid duplication); map sits higher by reducing gaps/padding.
- **Right Rail**
  - Placeholder “Insights” card; reserved for contextual insights/alerts; only on lg+ screens.

## Key Files
- `src/features/common/GlobalNav.tsx` – top icon nav; brand; hamburger.
- `src/components/UXShellLayout.tsx` – 2-column grid wrapper.
- `src/components/uxshell/Sidebar.tsx` + `NavSection/NavItem` – left navigation.
- `src/components/uxshell/UnifiedLayout.tsx` – assembles sidebar, embeds, command deck, right rail.
- `src/styles/uxshell.css` – layout grid, widths, padding, responsive tweaks, root gradient.

## Telemetry
- `emitTelemetry` hooks remain for view selection and layout violation (sidebar >320px).
- Nav interactions continue to log via `useChevronNav` / `Sidebar` handlers.

## Responsive Behavior
- Grid adjusts to 260px/240px sidebar with smaller gutters on <1440px / <1024px.
- Content padding scales down to keep the map and embeds higher on the page.

## Outstanding / Next
- Replace placeholder icons with final set if desired.
- Add conversational thread/right-rail insights per D065/D066 when ready.
- Optional: persist Command Deck prompt history, add assistant responses.
