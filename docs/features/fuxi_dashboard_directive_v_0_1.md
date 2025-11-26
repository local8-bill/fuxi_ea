## Directive 0001: Fuxi EA Dashboard v0.1

### Purpose
Create the first unified dashboard for the Fuxi EA product. This serves as both a visual design pilot and a functional monitoring interface for Mesh-driven operations. The dashboard will establish the Fuxi Design Language (FDL) and act as a foundation for future product visualization and agent activity tracking.

---

### Core Objectives
1. Build a new dashboard route (`/src/app/dashboard/`).
2. Test and apply the Fuxi Design Language across layout and visualization components.
3. Render meaningful mock data representing enterprise metrics and visualization models.
4. Ensure clean, modular code suitable for future integration with Mesh APIs.

---

### Sections (v0.1 Scope)
| Section | Function | Example Data | Visualization |
|----------|-----------|---------------|----------------|
| **Digital Enterprise Overview** | Visualizes enterprise nodes and relationships. | Mock `.fuxi/data/digital-enterprise` set. | Radial chart / network graph |
| **AI Utilization** | Tracks token use and reasoning cycles. | Mock token counts and task durations. | Bar / Donut chart |
| **Insight Feed (optional)** | Text-based feed of recent AI or agent notes. | Mock textual log. | Scrollable list |

---

### Design Language (Fuxi v1)
- **Colors:** Base `#f8f9fb`; Accents `#2563eb` (blue), `#9333ea` (violet); Text `#1e293b`.
- **Typography:** `Inter` / `IBM Plex Sans`; subtle tracking; 600 weight for headers.
- **Layout:** Grid and flexbox, with soft rounded corners (`rounded-2xl`), shadow depth, and 24px padding.
- **Motion:** `framer-motion` for subtle fade/slide transitions.
- **Icons:** `lucide-react` geometric minimal icons.
- **Charts:** `Recharts` responsive, minimal gridlines, calm colors.
- **Tone:** Analytical calm, modern precision — conveys trust and intelligence.

---

### Implementation Plan (for Codex)
1. **Branch:** `feature/dashboard_v0_1`
2. **Path:** `src/app/dashboard/`
3. **Files:**
   - `index.tsx` — main layout
   - `components/DashboardHeader.tsx`
   - `components/DashboardSection.tsx`
   - `components/charts/*` (Recharts components)
4. **Data:**
   - Mocks in `src/mock/dashboardData.ts`
   - Simulate 2–3 cycles of activity.
5. **Testing:**
   - Run `npm run build` and verify visual output.
6. **Commit Message:** `[dashboard_v0_1] Initial Fuxi EA dashboard implementation`
7. **Result:** Place summary JSON or log in `/mesh_prompts/completed/dashboard_v0_1_result.json`.

---

### Safety & Fallback
- Do **not** overwrite existing dashboard files; use new components if conflicts arise.
- If build fails, rollback to previous commit and output error log in `/completed/`.

---

### Success Criteria
- Dashboard builds and renders correctly.
- FDL elements implemented consistently.
- Mock data easily replaceable with Mesh API data.
- Clean, modular, and documented code.
- Confirm success through build + completion log.

---

### Directive Metadata
- **Project:** fuxi_ea
- **Issued by:** EA Mesh (GPT-5)
- **Issued on:** 2025-11-25
- **Type:** Build Directive
- **Priority:** High
- **Next Step:** Save as `/Users/local8_bill/Projects/fuxi_ea/mesh_prompts/incoming/20251125_fuxi_dashboard_v0_1.md`

