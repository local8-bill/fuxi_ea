## 🧩 Directive Addendum: D060B – Contextual Navigation Standard

### 1. Objective
Unify all navigation across Graph, ROI, Sequencer, Review, and Digital Enterprise using a single, chevron-style collapsible pattern modeled on ChatGPT’s left sidebar UX.

### 2. Interaction Model
```
▸ ROI
▸ Graph
▸ Sequencer
▸ Review
▸ Digital Enterprise
```
When expanded:
```
▾ ROI
   ROI 1 (Hypothesis)
   ROI 2 (Actuals)
   ROI 3 (Scenario B)
   + New ROI
```

- Only one section expanded at a time  
- Clean chevron (▸ / ▾) indicator — no arrows or dropdown carets on the right  
- Hover → light gray background + left accent bar  
- Active item → bold text + accent highlight  

### 3. Iconography (locked)
| Icon | Section | Semantics |
|:--:|:--|:--|
| **➕** | Graph | Relationships / Additions / Expansion |
| **∑** | ROI | Summation / Value / Benefit |
| **⇄** | Sequencer | Flow / Transformation |
| **✓** | Review | Validation / Approval |
| **∞** | Digital Enterprise | Systemic View / Continuum |

All icons to be implemented via lightweight SVG glyphs (Lucide or custom vector set) — *no emojis, no color fills*.  
Stroke = 1.5px, opacity 0.8, hover = 1.0.

### 4. Layout Standards
- Sidebar width ≤ 240 px  
- Sub-item indentation 16 px, font 12 px, line height 18 px  
- Max-height = viewport – nav header – prompt footer  
- Vertical scroll enabled if overflow  

### 5. Persistent Behavior
- Store last-expanded section + active item per project in `localStorage` (`fuxi_nav_state`).  
- Restore on load.  
- Telemetry event: `nav_section_opened`.  

### 6. Implementation Reference
Base component:  
`/components/uxshell/NavSection.tsx`  
Logic hook:  
`/hooks/useChevronNav.ts`  

---

### 🧱 Developer Notes

#### Component Structure
**Primary Components**
- `NavSection.tsx` — Manages individual collapsible sections.
- `NavSidebar.tsx` — Renders the full navigation stack, including project context.
- `ChevronIcon.tsx` — SVG-based dynamic icon switching between `▸` and `▾`.
- `NavItem.tsx` — Displays child entries with contextual hover and active states.

**Logic Hooks**
- `useChevronNav.ts`: manages expand/collapse state and telemetry logging.
- `useActiveItem.ts`: syncs selection state between nav and content views.

#### Props Interface
```ts
interface NavSectionProps {
  title: string;                 // e.g., 'ROI', 'Graph'
  icon: ReactNode;               // SVG or Lucide icon
  items?: NavItemProps[];        // Sub-items (if any)
  isExpanded?: boolean;          // Default expanded state
  onToggle?: (title: string) => void; // Callback for expansion
}

interface NavItemProps {
  label: string;                 // e.g., 'ROI 1 (Hypothesis)'
  path: string;                  // Route or command link
  isActive?: boolean;            // Current selection
  onClick?: (path: string) => void; // Trigger route change
}
```

#### Styling Notes
- Use Tailwind for padding/margin (e.g., `pl-4 py-1 text-sm text-gray-700 hover:bg-gray-100`).
- Add a `border-l-2` accent on hover or active states.
- Use CSS transitions (`transition-all ease-in-out duration-200`) for smooth expansion.

#### Behavior Example
```jsx
<NavSection title="ROI" icon={<SumIcon />}>
  <NavItem label="ROI 1 (Hypothesis)" path="/roi/hypothesis" />
  <NavItem label="ROI 2 (Actuals)" path="/roi/actuals" />
  <NavItem label="ROI 3 (Scenario B)" path="/roi/scenario-b" />
  <NavItem label="+ New ROI" path="/roi/new" />
</NavSection>
```

---

### 📊 Telemetry & Analytics Summary

#### Event Matrix
| Event | Trigger | Payload | Purpose |
|--------|----------|----------|----------|
| `nav_section_opened` | User expands a section (ROI, Graph, etc.) | `{ projectId, sectionTitle, timestamp }` | Track engagement frequency and preferred workflows |
| `nav_item_selected` | Sub-item (e.g., “ROI 2 – Actuals”) clicked | `{ projectId, section, itemLabel, route }` | Map frequently accessed reports/views |
| `nav_state_restored` | On app load (nav restores previous state) | `{ projectId, restoredSection, restoredItem }` | Validate persistence success and UX continuity |
| `nav_hover_duration` *(optional)* | Hover time on sections | `{ projectId, section, durationMs }` | Optional signal for UX interest weighting |

#### Implementation Hook
Telemetry integrates seamlessly via the existing logger in `/domain/telemetry/logger.ts`:
```ts
import { logEvent } from '@/domain/telemetry/logger';

logEvent('nav_section_opened', {
  projectId,
  sectionTitle,
  timestamp: new Date().toISOString(),
});
```
Enable debug mode via `.env.local`:
```
NEXT_PUBLIC_TELEMETRY_DEBUG=true
```

Telemetry hooks are embedded in `useChevronNav.ts` and `useActiveItem.ts` for minimal boilerplate.

---
✅ Clean  
✅ Predictable  
✅ Extensible  
✅ Developer-Ready  
✅ Telemetry-Ready

