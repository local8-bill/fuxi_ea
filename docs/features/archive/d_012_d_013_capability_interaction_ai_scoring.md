## Directive D012-013: Capability Interaction + AI Scoring Layer

**Status:** ✅ Completed

### Purpose & Scope
Unify and extend the Capability Workspace (from D011) to introduce live interaction mechanics and AI-assisted scoring. The objective is to make the workspace both tactile and intelligent: users can directly manipulate their data (edit, drag, create) and optionally engage AI to reason through capability scoring via short, contextual conversations.

---

### Core Interaction Features

1. **Inline Editing**  
   - Enable direct edits to capability cards (title, description, domain).  
   - Use `react-hook-form` for live validation and autosave on blur.  
   - Validation with `Zod` schemas for consistency.

2. **Add/Edit Drawer**  
   - Replace modals with a right-side drawer using `@radix-ui/dialog` or `framer-motion`.  
   - Supports creating new capabilities or modifying existing ones.  
   - Include inline helper text and example entries.

3. **Drag-and-Drop Hierarchy (React DnD)**  
   - Allow L1/L2 rearrangement and domain reassignment via drag-and-drop.  
   - Visual feedback for valid/invalid moves.  
   - Maintain persisted order in `.fuxi/data/capabilities.json`.

4. **Dynamic Scoring Chips**  
   - Replace dropdowns with colored chips:  
     `Strong 🟩`, `Neutral 🟨`, `Gap 🟥`.  
   - Keyboard shortcuts for quick scoring (1–3).  
   - Hover tooltips show scoring definitions.

5. **Undo/Redo Stack**  
   - Maintain local state history using React state + `immer`.  
   - Buttons in toolbar: [Undo] [Redo].

---

### AI Scoring Layer (Wave 1)

**Conversational Micro-Assessment UX**  
- The user can toggle AI scoring on/off globally or per capability.  
- When enabled, an **AI Assist** button appears on each capability card.  
- Clicking it opens a drawer chat where AI conducts a short, structured interview (3–5 questions).

**Example Flow**  
1. AI: *“How standardized are your processes for this capability?”*  
2. User: *“Defined, but inconsistently applied.”*  
3. AI: *“Understood. Are there tools that support this process?”*  
4. User: *“A few legacy ones, limited integration.”*  
5. AI: *“Result: Maturity 3.4 — Moderate, with risk from tech fragmentation.”*

**Data Model Extension**  
```json
{
  "id": "C001",
  "name": "Customer Onboarding",
  "domain": "Customer Experience",
  "score": 3.4,
  "ai_rationale": "Defined process, inconsistent tooling integration",
  "confidence": 0.86,
  "last_assessed": "2025-11-25T22:11:00Z",
  "assessment_mode": "ai_conversational"
}
```

---

### AI Toggle & Controls

**Configuration**  
In `config/app.config.json`:
```json
{
  "features": {
    "ai_conversational_scoring": true
  }
}
```

**Environment Variable:**  
`NEXT_PUBLIC_AI_SCORING_ENABLED=true|false`

**UI Toggles:**  
- Global toggle in *Settings → Labs*: “AI-Assisted Capability Scoring (Beta)”.  
- Per-project override in project config or dashboard.  
- Inline toggle in drawer: `[AI Assist: ON | OFF]`.

**Behavior:**  
- When OFF → only manual scoring visible.  
- When ON → AI chat drawer available; AI cannot apply score without explicit “Accept Score” confirmation.  
- Mid-session toggling preserves local state but stops message streaming.

---

### UX States: Manual vs. AI-Assisted
| Mode | Description | Actions Available |
|------|--------------|-------------------|
| Manual | Classic numeric or chip scoring | Edit, Add, Delete, Manual Score |
| AI-Assisted | Conversational micro-assessment | AI chat, Accept/Reject score, View rationale |

---

### Implementation Details
- **Branch:** `feat/d012_d013_interaction_ai_scoring`  
- **Libraries:** `react-hook-form`, `zod`, `framer-motion`, `react-dnd`, `papaparse`, `localforage`.  
- **Persistence:** extend `.fuxi/data/capabilities.json` with AI fields.  
- **Auth:** optional; AI calls proxied through backend with MESH_AUTH_TOKEN if available.  
- **Safety:** AI summarization only, no sensitive data retention beyond project context.

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Inline Editing | All edits autosave and validate via Zod | ☐ | Codex |  |
| Drawer Add/Edit | Opens, saves, and closes without state loss | ☐ | Codex |  |
| Drag & Drop | Capabilities reorder and persist correctly | ☐ | Fuxi |  |
| Scoring Chips | Visual feedback consistent; color contrast AAA | ☐ | Mesh |  |
| Undo/Redo | Action stack works for 5+ actions | ☐ | Codex |  |
| AI Toggle | Global and per-project toggles operate correctly | ☐ | Mesh |  |
| AI Scoring | Conversational flow produces consistent scores | ☐ | Fuxi |  |
| Safety | AI scoring requires explicit confirmation | ☐ | Codex |  |
| Build | Branch compiles cleanly | ☐ | Mesh |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-25  
- **Type:** UX/AI Interaction Directive  
- **Priority:** High  
- **Feature Branch:** `feat/d012_d013_interaction_ai_scoring`  
- **Auth Mode:** Optional  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D012_D013_interaction_ai_scoring.md`
