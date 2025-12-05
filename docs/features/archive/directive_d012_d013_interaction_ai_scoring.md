## Directive D012-013: Capability Interaction + AI Scoring Layer (Canonical Copy)

**Branch in use:** `feat/d012_d013_interaction_ai_scoring`. Timestamp: 2025-11-26T06:32Z.

### Purpose
Add tactile interactions (inline edit, drag/drop, undo/redo) and optional AI-assisted scoring to the Capability Workspace (D011), keeping schema compatibility and safety.

### Plan
- Inline edit with react-hook-form + zod; autosave on blur.
- Add/Edit drawer (Radix) for create/update with helper text.
- Drag/drop hierarchy (React DnD) for L1/L2 reorder + domain change, persists order to `.fuxi/data/capabilities.json`.
- Scoring chips (gap/neutral/strong) with keyboard shortcuts and tooltips; undo/redo stack.
- AI Assist drawer: conversational micro-assessment, requires accept to apply score; toggles via env and UI.

### Data
- Extend capability shape with `ai_rationale`, `confidence`, `last_assessed`, `assessment_mode`.
- Respect existing capability schema in `.fuxi/data/capabilities.json`.

### Verification & Validation
| Checkpoint | Description | Status | Verified By | Timestamp |
| --- | --- | --- | --- | --- |
| Inline Editing | Autosave + zod validation | ☐ | Codex |  |
| Drawer Add/Edit | Opens/saves/closes cleanly | ☐ | Codex |  |
| Drag & Drop | Order persists correctly | ☐ | Fuxi |  |
| Scoring Chips | AAA contrast; shortcuts | ☐ | Mesh |  |
| Undo/Redo | Works for 5+ actions | ☐ | Codex |  |
| AI Toggle | Global + per-project toggle | ☐ | Mesh |  |
| AI Scoring | Conversational flow + accept | ☐ | Fuxi |  |
| Safety | No auto-apply without confirm | ☐ | Codex |  |
| Build | Compiles cleanly | ☐ | Mesh |  |

### Notes
- Env: `NEXT_PUBLIC_AI_SCORING_ENABLED=true|false` (default off). Future: app config feature flag.
- AI calls proxied via backend; summarize only, no sensitive data retention.
