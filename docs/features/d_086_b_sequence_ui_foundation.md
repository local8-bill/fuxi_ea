## Directive D086B – Sequence Builder Template (Fuxi UI Foundation)

### 🎯 Objective
Establish a pristine, minimal, engineering-grade UI template for the **Sequence Builder** scene, forming the foundation of Fuxi’s standardized interface. This directive replaces legacy prototype UI patterns with Shadcn components and codifies the visual identity, layout grammar, and UX tone.

---

### 🧩 Core Implementation Rules

**1. Template Composition**
- Built entirely with **Shadcn/UI** components (Accordion, Tabs, Dialog, Button, Toggle, Separator, etc.).
- No legacy components, no ReactFlow styling dependencies beyond the graph canvas itself.
- Graph Canvas is rendered within a `Stage` container occupying 100% remaining viewport height/width.

**2. Page Structure**
| Region | Description |
| ------- | ------------ |
| **Top Bar** | Persistent global navigation (no changes). Contains command input, mode toggle, and feedback entry. |
| **Left Rail** | Navigation & Scene selector (240px fixed). Collapsible. Retains existing mode icons. |
| **Center Stage** | Hero area for the graph or sequence editor. Uses consistent background and typography. |
| **Right Rail** | Insight and Action panel (240px fixed). Collapsible. Hosts the Option Menu (Sequence Builder / Harmonize / Add View). |

**3. Layout Rules**
- Collapsible arrows `<` / `>` anchored mid-edge of each rail.
- When both rails collapsed, Stage expands full width.
- Rails slide with no animation lag (> 60fps). No transitions longer than 150ms.
- No gradient fills. No drop shadows.
- Typography harmonized to 3 scales (sm / base / lg). Font: `Inter` or system default sans-serif.

---

### 🧭 Fuxi Visual Identity — Navigation & Tone Specification

**Design Principles**
- Feel: *Engineering console*, not a marketing site.
- Aesthetic: flat hierarchy, clear affordances, monochrome with sparing accent.
- Iconography: Lucide only, size 16–18px, stroke 1.5px.
- Color Palette:
  - Background: `#1E1E2E` / `#2D2E3E`
  - Foreground: `#FFFFFF`
  - Accent: `#7C3AED`
  - Muted: `#A1A1AA`
- No gradient, no blurs, no decorative textures.

**Top Bar**
- Maintain existing `ExperienceShell.TopBar` exactly.
- Left-aligned logo and command surface.
- Right-aligned mode switch and notifications.
- Top bar color: same as background, separated only by a subtle 1px divider.

---

### 🧬 Fuxi Application Grammar (Non-Deviating Framework)

| Element | Role |
| -------- | ---- |
| **Scene** | High-level workspace context (Digital Twin, Sequencer, Org Intelligence). |
| **Stage** | Visual viewport or primary interaction area within the scene. |
| **Rail** | Left: Navigation; Right: Insights/Tools. Each 240px wide, collapsible. |
| **Language System** | Terminology is fixed: Scene, Stage, Rail, Insight, Sequence, Mode. No new nouns allowed. |
| **Command Surface** | The global top-bar input, used for EAgent / ALE / Sequencer intents. |

---

### 🧰 DX Startup Instructions

1. **Branch setup**
   ```bash
   git checkout -b feature/d086b_sequence_ui_foundation
   npm run dev:nuke
   ```

2. **File structure**
   - Create: `src/app/dev/sequence-template/page.tsx`
   - Create: `src/components/layout/Rail.tsx`, `Stage.tsx`, `OptionMenu.tsx`
   - Reuse: `ExperienceShell.TopBar` and shared GraphCanvas container.

3. **Implementation checklist**
   - Use **Shadcn/UI** for Accordion, Button, and Dialog components.
   - Left and Right Rails = 240px, collapsible via simple chevron toggles.
   - Center Stage = full canvas when rails hidden.
   - No gradients, shadows, or animations >150ms.
   - OptionMenu contains:
     - Build a Sequence  
     - Harmonize Stack  
     - Add View  
   - Verify clean console log (`npm run dev` → no warnings).

4. **Testing**
   ```bash
   npm run dev
   # navigate to
   http://localhost:3000/dev/sequence-template
   ```

5. **Review criteria**
   - Layout integrity (no overlapping elements)
   - Proper rail collapse/expand
   - Top bar alignment consistent with `ExperienceShell`
   - Code under 200 lines; use modular imports.

---

### 🧱 Integration Scope
- Implement as standalone scene: `src/app/dev/sequence-template/page.tsx`
- Import the Graph Canvas and Stage shell only; data binding is out of scope for this sprint.
- Ensure Shadcn theme tokens are used for spacing, colors, and typography.
- Create reusable `Rail`, `Stage`, and `OptionMenu` components in `src/components/layout/`.

---

### 🧾 Completion Criteria
- ✅ New Sequence Builder template renders without console errors.
- ✅ Shadcn layout components replace all legacy markup.
- ✅ Rails fully collapsible with clean transitions.
- ✅ Visual identity matches Fuxi console spec.
- ✅ Option menu includes working buttons for:
  - `Build a Sequence`
  - `Harmonize Stack`
  - `Add View`
- ✅ No shadows, gradients, or inconsistent fonts.

**Branch:** `feature/d086b_sequence_ui_foundation`  
**Approvers:** Bill (Agent Z), dx  
**Next Step:** Once template approved, initiate D087 – Fuxi Design System foundation.