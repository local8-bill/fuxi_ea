## Directive D086C – Iconography Standard (Final)

### 🎨 Purpose
Establish a consistent, professional, and engineering-grade iconography system across all Fuxi scenes, rails, and templates. This directive replaces all legacy icons and ensures uniform tone, geometry, and technical clarity.

**No creative substitutions. No gradients. No cartoon elements.**

---

### 🔧 Technical Source
- **Primary Library:** `lucide-react` (via Shadcn/UI)
- **Secondary (optional):** custom engineering icons in `/src/components/ui/icons/`
- **Style Rules:**
  - Stroke weight: **1.5px** (consistent across all)
  - Default size: **16px** inline, **20px** for navigation
  - Color: `--foreground` for default, `--accent-foreground` for hover/active
  - Alignment: vertical center; 4px margin spacing left/right
  - **No gradients, no drop shadows, no color fills**

---

### 🗂️ Approved Icon Set (Lucide IDs)
| Concept | Icon Name | Lucide ID | Notes |
|----------|------------|------------|--------|
| **Navigation / Home** | Home | `Home` | Primary entry point icon |
| **Digital Twin** | Network | `Network` | Represents ecosystem view |
| **Sequencer** | Workflow | `Workflow` | Process and phase modeling |
| **ROI / TCC** | Trending Up | `TrendingUp` | Performance and outcomes |
| **Insights** | Lightbulb | `Lightbulb` | Discovery, intelligence cue |
| **Intelligence** | Brain | `Brain` | Cognitive / organizational lens |
| **ALE Engine** | CPU | `Cpu` | Learning / reasoning engine |
| **Settings** | Cog | `Settings` | Universal control icon |
| **Theme Toggle** | Half Moon | `SunMoon` | Light/dark mode toggle |
| **Collapse / Expand** | Chevrons | `ChevronLeft` / `ChevronRight` | Rail controls |

---

### 🔄 Implementation Example
```tsx
import { Home, Network, Workflow, TrendingUp } from "lucide-react";

function NavItem({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <Icon size={16} strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  );
}
```

---

### 🔍 Visual Reference (QA)
A monochrome grid of the approved Lucide icons is stored at:
```
/public/assets/style/iconography_reference.png
```
Use this for verification and onboarding documentation only. No UI embedding required.

---

### 🔹 Integration Guidance
- All nav and rail components must use this registry.
- Replace legacy `SidebarIcon`, `UXShellIcon`, and SVG assets.
- Maintain consistent hover/active visual tone with Shadcn theme tokens.
- Reference icons through `src/components/ui/icons.tsx` registry.

---

### 🔍 Completion Criteria
- Lucide icons installed and standardized.
- Legacy icons removed from `/public/icons/` and `src/components/uxshell/icons/`.
- All scenes (Twin, Sequencer, Intelligence, ALE) use approved icon mapping.
- Visual grid exported and linked in documentation.
- Validation script added to ensure only approved Lucide IDs are imported.

**Branch:** `feature/086c_iconography_standard`  
**Dependencies:** `D086B_Shadecn_Refresh`, `D087C_Theme_Test_Harness`  
**Approvers:** Agent Z (Bill), dx
