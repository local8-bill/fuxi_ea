### 🧠 Directive D065 — Conversational Interaction Mandate (CIM)

**Purpose:**  
To ensure that all user interactions within Fuxi simulate intelligent, natural conversation — replacing static configuration with contextual dialogue.

**Principle:**  
> “Every interaction in Fuxi should feel like a conversation between expert collaborators, not a user filling out a form.”

---

### Core Tenets

**1. Conversational Context**  
- All input flows must ask questions in natural language.  
- UI should *listen, respond, and guide*, not instruct.  
- Every action is presented as part of a dialogue (“Would you like to continue?” rather than “Next”).

**2. Adaptive Flow**  
- Questions and next steps evolve based on user input and system understanding.  
- Avoid fixed “wizard” flows; onboarding, ROI setup, and analysis must all branch dynamically.  
- Conversational state should persist and resume across sessions.

**3. Explainable Tone**  
- Fuxi must always communicate *why* it’s asking or recommending something.  
- Example: “I’m asking this because your last project focused on Modernization.”  
- All recommendations must be traceable to project data or context.

**4. Integrated Intelligence**  
- Conversational prompts are powered by context (telemetry, role, history, and artifacts).  
- Every major module (ROI, Sequencer, Harmonization, Transformation) must be callable from the command deck as a conversational action.  
- AI should infer probable next actions and gently guide toward them (“It looks like you’re reviewing ROI. Would you like to compare scenarios?”).

**5. User Comfort & Empathy**  
- The interface must feel personal and responsive — less like a console, more like a collaborator.  
- Replace friction with trust: explain, simplify, and acknowledge user effort.  
- Never overwhelm; always summarize and confirm before moving forward.

---

### Implementation Standard

- Conversational UI layer will extend the Unified UXShell and power guided onboarding, project setup, and scenario exploration.  
- All new features must define conversational intents and fallback prompts in their directive specs.  
- Existing pages (ROI, Graph, Sequencer) to be migrated to guided conversational flows by default.  
- Telemetry events (e.g., `conversation_step_completed`, `prompt_context_switched`) will record engagement patterns.

---

### Example Dialogue Snippet
```
Fuxi: Welcome back, Architect. Ready to continue where we left off in your 700am workspace?
User: Yes, show me the ROI for Commerce.
Fuxi: Sure. Based on your last simulation, ROI was 438%. Would you like to see the updated version including Finance and Data domains?
User: Yes.
Fuxi: Got it. I’ll merge the new data and update your dashboard. Should I log this as Scenario B?
```

---

### 🔧 Retrofit Guidelines for Existing Modules

#### ROI Dashboard
- Replace static filter panels with conversational filters (“Which domain’s ROI would you like to explore?”).
- Auto-summarize changes in natural language (“Finance ROI increased 14% since your last run”).
- Embed “Explain this” prompts beside any metric that links back to Math Explainers.

#### Sequencer
- Convert stage configuration into guided dialogue:  
  - “Would you like to simulate a dual-run for ERP NextGen?”  
  - “Shall I calculate transition cost overlap for Stage 2?”
- Maintain timeline visuals, but drive their configuration through dialogue.

#### Graph (React Flow)
- When a user clicks a node:  
  “This system has 5 dependencies and 2 unresolved edges. Would you like to see its impact?”
- Support conversational filtering:  
  “Show only cross-domain edges in the Finance cluster.”

#### Onboarding
- Use the AI questions we outlined earlier to establish **tone, intent, and tolerance for change**.
- Persist responses as part of the enterprise model (metadata tied to persona).

---

**Author:** Fuxi Core Design Group  
**Status:** Adopted  
**Applies to:** All modules, directives, and future UX implementations within the Fuxi Ecosystem.

