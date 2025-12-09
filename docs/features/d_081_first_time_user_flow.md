## 🧭 Directive D081 – First-Time User Flow / Project Creation Journey

### Objective

Design and implement the **first-time user journey** that allows anyone—without prior context—to land on the Fuxi\_EA platform, create a project, and experience tangible value within minutes.

This directive establishes the core onboarding funnel that transforms new visitors into engaged users by guiding them through project creation, artifact upload, digital twin visualization, and ROI/Sequencer exploration.

---

### 🎯 Experience Goals

- Zero setup required — a user should be able to start from a shared URL.
- Single CTA: **“Create a Project.”**
- Smooth conversational guidance from EAgent.
- Immediate feedback after artifact upload (digital twin preview).
- Continuous narrative from upload → insight → ROI → sequencing → review.
- Integrated conversational feedback (`/feedback` command).
- No legacy UX, no dev jargon, no hidden routes.

---

### 🧩 User Flow Overview

**Entry point:** `/home` (or root `/`)

| Step | User Action                                                                                                   | System Response                                                                              | Scene                                       |
| ---- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1️⃣  | User lands on homepage                                                                                        | Fuxi greets: “Welcome to Fuxi — build your digital enterprise, one move at a time.”          | `/home`                                     |
| 2️⃣  | Clicks **“Create a Project”**                                                                                 | API call: `/api/projects/init` → returns `project_id`. Redirects to onboarding scene.        | `/project/<id>/experience?scene=onboarding` |
| 3️⃣  | EAgent greets: “Welcome to your workspace. Want to upload your current tech inventory or start from scratch?” | Display guided upload panel.                                                                 | Onboarding                                  |
| 4️⃣  | User uploads artifact (CSV/JSON/Excel)                                                                        | Fuxi parses, validates, and visualizes dependencies.                                         | Digital Twin                                |
| 5️⃣  | EAgent: “Here’s a map of your systems — I see overlaps and dependencies. Want to focus by domain or region?”  | Graph and insights shown.                                                                    | Digital Twin                                |
| 6️⃣  | User selects focus area                                                                                       | Fuxi transitions to ROI scene.                                                               | ROI                                         |
| 7️⃣  | EAgent explains: “Let’s look at where your investments and risks cluster.”                                    | ROI summary and TCC displayed.                                                               | ROI                                         |
| 8️⃣  | User continues to Sequencer or Review                                                                         | EAgent narrates transition: “Now let’s model how to make these changes.”                     | Sequencer / Review                          |
| 9️⃣  | User reaches Review scene                                                                                     | Summary of insights, key impacts, and next steps.                                            | Review                                      |
| 🔟   | User types `/feedback`                                                                                        | EAgent enters feedback mode: “Got it — I’d love to hear your thoughts. What’s on your mind?” | Any Scene                                   |

---

### 🧠 EAgent Script Elements

- **Tone:** Conversational, confident, approachable.
- **Mode:** `/mode user`

#### 🗣️ EAgent Welcome Script

```json
[
  {
    "step": 1,
    "greeting": "Hello there — welcome to Fuxi! I'm your EAgent, here to help you map and simplify your enterprise.",
    "follow_up": "Would you like to start by creating a new project?"
  },
  {
    "step": 2,
    "greeting": "Perfect. Let’s get your workspace ready.",
    "follow_up": "You can upload an inventory file (CSV, JSON, or Excel) or start from a clean slate. What would you prefer?"
  },
  {
    "step": 3,
    "greeting": "Got it — I’m analyzing your file now…",
    "follow_up": "Looks like you’ve got {{system_count}} systems across {{domain_count}} domains. I can show you the map or summarize key overlaps — your choice."
  },
  {
    "step": 4,
    "greeting": "Here’s your digital twin — a living map of your enterprise.",
    "follow_up": "We can explore by domain, region, or risk. What’s most useful for you right now?"
  },
  {
    "step": 5,
    "greeting": "I see areas with high complexity and cost concentration.",
    "follow_up": "Would you like to estimate ROI or start sequencing changes?"
  },
  {
    "step": 6,
    "greeting": "Alright, let’s calculate potential ROI and total cost of change.",
    "follow_up": "I’ll highlight key investment zones and expected outcomes for each phase."
  },
  {
    "step": 7,
    "greeting": "Here’s your ROI summary — savings, investments, and timing in one view.",
    "follow_up": "Would you like to move to sequencing or review the plan?"
  },
  {
    "step": 8,
    "greeting": "Let’s build your transformation roadmap.",
    "follow_up": "We’ll sequence changes by dependency and risk, ensuring minimal disruption."
  },
  {
    "step": 9,
    "greeting": "Here’s your summary — transformation phases, cost, and impact.",
    "follow_up": "Want me to package this up as a report or continue refining your roadmap?"
  },
  {
    "step": 10,
    "greeting": "I can also take your feedback anytime.",
    "follow_up": "Just type /feedback and tell me what you think — I’ll log it for Bill and the team."
  }
]
```

---

### 🗂️ Technical Behavior

- `/api/projects/init` generates minimal schema.
- File upload handled via `/api/ingestion/inventory`.
- On success → transition to `/experience?scene=digital`.
- **Feedback command (****/feedback****)** logs user messages to `.fuxi/data/feedback.ndjson`:

```json
{
  "user_id": "anon_37",
  "project_id": "a13b-4959",
  "scene": "roi",
  "message": "It would be great if the ROI view let me compare multiple projects.",
  "timestamp": "2025-12-09T16:20Z"
}
```

- Telemetry tags:
  - `project_created`
  - `artifact_uploaded`
  - `digital_twin_loaded`
  - `user_first_insight`
  - `roi_stage_calculated`
  - `sequencer_initiated`
  - `feedback_initiated`
  - `feedback_submitted`

---

### 🧩 UX Constraints

- No legacy components (remove Labs, Junk Drawer, legacy forms).
- Landing page minimal: hero + CTA.
- Onboarding conversational panel replaces static forms.
- File uploads show immediate visual feedback (progress bar → map reveal).
- Provide a “skip upload” path for demos (auto-load sample data).
- Include **Tips** system via EAgent cues (e.g., prompt users to try `/feedback`).

---

### ✅ Deliverables

- `/app/home/page.tsx` updated for simplified CTA.
- `/api/projects/init` endpoint verified.
- `/experience/onboarding` flow connected to digital twin.
- Telemetry verification for first-time actions.
- EAgent onboarding prompts defined in `/lib/agent/scripts/onboarding.ts`.
- `/feedback` command integrated into EAgent command parser.
- Feedback log persisted to `.fuxi/data/feedback.ndjson`.

---

### 🧭 Governance

- **Branch:** `feature/d081_first_time_user_flow`
- **Commit:** `feat(onboarding): implement first-time user creation, guided flow, and conversational feedback`
- **Approvers:** Fuxi & Agent Z (Bill)
- **Dependencies:** D060 (UX Shell), D062 (Guided Onboarding), D079 (Modes Framework)
- **Output:** Seamless, demo-ready first-time user experience — from project creation to ROI insight — guided by EAgent and enhanced with conversational feedback.

