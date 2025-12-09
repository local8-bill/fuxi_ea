### 🧭 Directive D066E – Conversational Experience & Navigation Alignment

---

#### 🧱 Canonical Sidebar Reminder (per D060A – Unified UXShell Sidebar Structure)

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

   ∞ Digital Twin
   ⇄ Sequencer
   ✓ Review

▾ MODES
   Architect
   Analyst
   CFO
   FP&A
   CIO
```

**This structure is fixed and locked.**  
No nesting, rearranging, or re-parenting of items is permitted without explicit approval.  
All related state persistence, telemetry, and CSS layout must map to this hierarchy exactly.  
Any reappearance of legacy sidebar logic (auto-nesting, dynamic sub-routes, or drifted persistence keys) will be considered a regression.

---

#### 🧩 Developer Note to Codex
> The **left navigation structure** must strictly adhere to **Directive D060A — Unified UXShell Sidebar Structure (Final)**.  
> This means:
> - “Digital Twin,” “Sequencer,” and “Review” belong **at the same hierarchy as ROI**, *not nested beneath it*.  
> - The canonical layout and interaction rules in D060A are immutable and cannot be altered without direct approval.  
> - Treat this as a fixed schema: any variations or auto-generated nesting are non-compliant.

---

### Objective
Unify all “ask,” “search,” and “agent” experiences across Fuxi · Enterprise Engine under UXShell v0.3.  
Eliminate redundant dialogues, align query routing, simplify onboarding flow, and consolidate navigation behavior.

### Scope
Applies to:
- `/components/CommandDeck.tsx`
- `/components/ConversationalAgent.tsx`
- `/components/SearchModal.tsx`
- `/components/layout/UXShellLayout.tsx`
- `/components/GuidedOnboarding.tsx`
- `/lib/agent/queryRouter.ts` (new)
- `/lib/telemetry/agentEvents.ts`

---

### Summary of Fixes

| Issue | Description | Resolution |
|-------|--------------|-------------|
| 7 | Guided onboarding auto-redirects after upload | User must confirm “Proceed to Digital Twin” after upload; optional auto-advance toggle. |
| 8 | Duplicate query inputs (Ask + Agent) | Unified preference toggle (`deck` / `agent`) stored in `uxshell_preferences.agent_mode`. Only one visible at a time. |
| 9 | Global Search overlaps conversational intent | Consolidate via `/lib/agent/queryRouter.ts` — dispatches to `search`, `contextual`, or `agent` flows. `⌘ / Ctrl + K` opens unified search modal. |

---

### Interaction Diagram

```
[User Input] ──▶ [queryRouter]
                    ├─ "search"     → GlobalSearchModal
                    ├─ "contextual" → CommandDeck (page scope)
                    └─ "agent"      → ConversationalAgent (full context)
```

---

### Implementation Details

**Guided Onboarding Fix**  
- Remove auto-redirect in `onFileUploadSuccess()` (`/components/OnboardingForm.tsx`).  
- Replace with agent modal: “File received! Do you want to start analyzing now?”  
- Add optional “auto-proceed after upload” preference.  
- Context passed as query params when proceeding manually.

**Conversational Unification**  
- Merge logic in `/lib/agent/interaction.ts` to handle both inline and overlay queries.  
- Create user setting `uxshell_preferences.agent_mode` in localStorage.  
- Refactor `/components/CommandDeck.tsx` and `/components/ConversationalAgent.tsx` for conditional rendering.

**Query Router + Global Search Integration**  
- Create `/lib/agent/queryRouter.ts` to triage input intent.  
- Refactor `/components/SearchModal.tsx` to use router for shared logic.  
- Deprecate `useSearchModal.ts` and legacy direct search logic.

---

### Telemetry Additions

| Event | Trigger | Purpose |
|--------|----------|----------|
| `agent_mode_switch` | User toggles query interface | Track interface preference |
| `agent_query_submitted` | User submits query | Unified entrypoint logging |
| `agent_intent.triggered` | Agent interprets query intent | Intent analytics |
| `search.quick_open` | User opens search modal | Quick search engagement |
| `search.result_selected` | User selects result | Conversion tracking |

---

### QA Checklist

✅ Only one query interface rendered per session.  
✅ User preference persists via localStorage.  
✅ Search uses unified router.  
✅ File upload doesn’t auto-route.  
✅ Telemetry events recorded consistently.  
✅ Sidebar structure verified against D060A.  

---

**Integration Command:**
```json
{
  "cmd:uxshell:conversational": {
    "description": "Implements conversational UX and navigation alignment per D066E.",
    "script": "node ./scripts/uxshell_conversational_alignment.js"
  }
}
```

