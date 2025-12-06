## 🧭 Directive D071 – Navigation, Home, and Conversational Continuity Standard

**Version:** v0.7.4-draft  
**Purpose:** Define the `/home` conversational entry point, continuous navigation model, and assistive demo flow logic for the Fuxi_EA application.

---

### 1️⃣ Home Concept — The Command Deck

- **Route:** `/home` (root redirect)
- **Purpose:** Serve as the conversational anchor and re-entry point for every architect.
- **Behavior:**
  - New users see a friendly “where do I get started?” prompt.
  - Returning users see memory-based prompts (“where did we leave off?”).
  - All users can ask meta-questions (“can you walk me through a demo?”, “how do I calculate ROI?”, etc.).

---

### 2️⃣ Conversational States

| User Type | Agent Behavior | Example Prompt |
|------------|----------------|----------------|
| **First-time** | Explain the core functions (map, harmonize, forecast) and invite next action. | “I can help you model your enterprise. Would you like to start with an upload or a walkthrough demo?” |
| **Returning** | Recall last context (project, stage, focus areas). | “You were working on Finance harmonization. Would you like to resume or see what’s next?” |
| **Learner Mode** | Offer guided demos or feature explanations. | “Sure — I can walk you through how ROI forecasting works. Would you like to see it in your data or a sample model?” |

---

### 3️⃣ Conversational Continuity Logic

- System stores a small session file:
  ```json
  {
    "projectId": "finance-demo",
    "lastStage": "harmonization",
    "lastIntent": "sequence",
    "lastSeen": "2025-12-05T16:32Z"
  }
  ```
- Agent reads that session and dynamically chooses its greeting and next-step prompt.
- `intentResolver()` maps user input like “where did we leave off”, “what’s next”, or “show me how to calculate” into predefined actions:
  - `resume_project`
  - `next_step`
  - `explain_feature(<topic>)`
- Responses are drawn from tone templates in D069/D069-A, preserving professional cadence and pacing.

---

### 4️⃣ Assistive Walkthrough Mode

Adds a lightweight **demo/explain layer** inside the agent.

#### User prompt patterns:
- “Can you walk me through a demo?”
- “Show me how harmonization works.”
- “Explain how ROI is calculated.”

#### Agent behavior:
- Detects `mode = explain`
- Loads relevant directive (D068, D052, etc.)
- Narrates step-by-step explanation **using real or mock data**, e.g.:
  > “Harmonization connects systems by identifying overlaps in function.  
  > Let’s look at Finance and ERP — they share three integration points.”

- Offers to switch back to live mode:
  > “Would you like to try that with your data?”

This doubles as your built-in **demo assistant** and **training layer** — no extra UI needed.

---

### 5️⃣ UX Principles

| Goal | Design Rule |
|------|--------------|
| **Continuity** | Always start from a conversational prompt; no dead screens. |
| **Memory** | Use short summaries of last actions for re-entry. |
| **Assistive Discovery** | Offer help/demos in natural language; not modals or tooltips. |
| **Graceful Transitions** | Fade between states (`/home` ↔ `/workspace/*`) with context labels. |
| **Minimalism** | Use ChatGPT-style whitespace design; focus on the chat input. |

---

### 6️⃣ Routing Overview

```
/home                → Command Deck (conversation root)
/workspace/setup     → Guided Onboarding
/workspace/inventory → Upload & Discovery
/workspace/enterprise→ Harmonization Graph
/workspace/roadmap   → Sequencing
/workspace/insights  → ROI / Value
```

Redirect logic:
- `GET /` → `/home`
- Agent navigates with conversational cues:  
  “Let’s move to your enterprise map” → `/workspace/enterprise`

---

### 7️⃣ Telemetry & Learning

Track and learn user patterns:
- `first_time_user`
- `resume_prompt_shown`
- `assistive_mode_triggered`
- `help_topic_accessed`

Store analytics in `/data/analytics/conversation_behavior.json` for refinement.

---

### ✅ Expected Outcome
- Home feels conversational, intelligent, and inviting.
- Fuxi_EA remembers context and reorients users instantly.
- The agent can *teach* or *demonstrate* any process on demand.
- Demo walkthroughs double as first-time onboarding and self-guided learning.

---

**Owner:** Product Management / UX / Codex Dev  
**Status:** 🚀 Active  
**Release Tag:** `v0.7.4-home-standard`

