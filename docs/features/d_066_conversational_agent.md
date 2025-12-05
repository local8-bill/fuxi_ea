## D066 — Conversational Agent (Persistent Shell Companion)

### Purpose

Transform the static “Guided Onboarding” experience into a **contextual conversational agent** that persists across the entire UXShell. This agent acts as an embedded collaborator that learns from user context, executes actions, and adapts throughout the workflow.

### Scope

- Replaces any static onboarding pages or menu items.
- Integrated with ROI, Graph, Sequencer, and Review modules.
- Always accessible via the conversational prompt bar (bottom dock).
- Conversational flow replaces form-based setup.

### Behavior

1. **Conversational Interface:** The user interacts with the agent using natural language prompts (e.g., “Show ROI for Commerce” or “Add ERP modernization to Sequencer”).
2. **Context Awareness:** The agent references `project`, `mode`, `view`, and `recentTelemetry` to provide relevant and precise responses.
3. **Inline Execution:** Executes actions or renders visual elements (charts, ROI summaries, sequencer stages) directly in response.
4. **Adaptive Dialogue:** Learns the user’s workflow preferences and prioritizes relevant next steps.
5. **Persistent Memory:** Maintains project-specific conversational state in `/data/sessions/{projectId}.json`.
6. **Telemetry:** Emits the following events:
   - `conversation_intent`
   - `agent_action_executed`
   - `context_resume_detected`

### Implementation Notes

- **Component:** `components/ConversationalAgent.tsx`
- **APIs:** `/api/agent/context`, `/api/agent/intent`, `/api/agent/execute`
- **Storage:** Session data persisted under project-scoped context.
- **UI Placement:** Minimal docked conversational bubble in the lower right, using standard shell typography and sizing.

### UX Mandate

The agent must **feel alive** — conversational, adaptive, and aware. It should never present static menus or redundant options. Every prompt should either:

- Provide insight,
- Execute a command, or
- Offer a guided next step.

---

## D066A — UXShell Lockdown & Alignment Enforcement

### Purpose

Preserve the canonical UXShell design and prevent layout drift in the left navigation lane. Enforce structural alignment and visual consistency across all builds.

### Locked Structure

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

### Enforcement Rules

1. **No new sections** may be added without explicit instruction.
2. **No labels or status tags** (LIVE / DRAFT / DEMO) permitted in production — they disrupt alignment.
3. **Section headings** must be uppercase, semibold, and text-only (no pill backgrounds).
4. **Expand/collapse icons** (`▾` / `▸`) must remain functional and correctly aligned.
5. **Grid alignment:** 12px gutter baseline; consistent vertical rhythm.
6. **Lock flag:** Add `UX_SHELL_LOCK = true` to configuration to prevent unapproved changes.

### Telemetry

- `uxshell_interaction` (captures section expand/collapse)
- `uxshell_lock_violation` (logs layout deviation attempts)

### Rationale

Maintaining visual discipline and consistent navigation is essential for user trust and spatial memory. Any modifications must pass UX governance review.

---

**Status:** Ready for implementation **Assigned To:** Codex / UXShell Maintainer **Version:** v0.6.12 **Dependencies:** None (supersedes D060 onboarding UI) **Next Step:** Integrate `ConversationalAgent.tsx` and enforce `UX_SHELL_LOCK` across dev branches.

