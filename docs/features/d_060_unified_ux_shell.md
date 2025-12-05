## 🧭 D060 — Unified UX Shell / Experience Framework
**Objective:** Replace the current multi-page dashboard layout with a single, immersive, chat-driven experience that adapts to the user’s role and task flow.

### 🎯 Core Goals
1. Merge all workspace modules (Graph, ROI, Sequencer, Intake, Harmonization) into a single adaptive UI shell.  
2. Introduce conversational navigation — “Ask the system” to move between or combine views.  
3. Deliver a UX that feels like working inside a *digital twin* of the enterprise — intuitive, explorable, and explainable.

---

### 🧩 Architecture Overview

#### 1. Layout Framework
- **Left Dock (Navigation / Mode Selector):**  
  Architect | Analyst | CFO | FP&A | CIO roles — adaptive context for each.  
- **Center Stage (Primary Workspace):**  
  Dynamic render zone for Graph / ROI / Sequencer / Review.  
- **Right Insight Rail (Contextual Intelligence):**  
  ROI tips, dependency alerts, cost insights, domain overlays.  
- **Bottom Chat Strip (Conversational Prompt):**  
  “Ask your enterprise” → powered by internal project data, not web search.

---

#### 2. Component Migration Map
| Current Feature | Future Placement | Notes |
|-----------------|------------------|-------|
| **Living Map (React Flow)** | Center Stage | Always visible with adaptive zoom / domain highlighting |
| **ROI Dashboard** | Right Insight Rail (expandable) | Summaries + drill-down |
| **Sequencer** | Slide-in Panel | Multi-stage roadmap builder |
| **Harmonization Review** | Modal or Subflow | Pre-sequencer input |
| **Intake Wizard** | Guided overlay | Converts answers → initial graph state |
| **Telemetry Console (internal)** | Hidden / Dev mode only | Moved under System tab |

---

#### 3. Conversational Layer (Phase 1)
- Natural-language prompt bar tied to internal APIs:  
  - “Show me ROI for Commerce only.”  
  - “Highlight systems impacted by ERP migration.”  
  - “When do we break even if we delay OMS by 6 months?”
- Returns structured responses in cards or graph overlays.  

---

#### 4. Visual Identity
- 🎨 **Tone:** Calm, elegant, confident — inspired by ChatGPT and Linear.app.  
- 🪶 **Typography:** Inter + JetBrains Mono for data/code duality.  
- 🌗 **Themes:** Light/Dark with domain-accent coloring (Finance, Order Mgmt, Data, etc.).  
- 🧱 **Components:** Built on ShadCN + Framer Motion (animation at state transitions).

---

#### 5. Milestones
| Phase | Deliverable | Target Tag |
|--------|--------------|-------------|
| 1️⃣ UX Shell Scaffolding | Layout container, chat strip, sidebar modes | `v0.7.0-uxshell` |
| 2️⃣ Conversational Routing | Semantic command → route/view logic | `v0.7.1-nav-ai` |
| 3️⃣ Contextual Insights | ROI & graph summaries auto-generated | `v0.7.2-insight` |
| 4️⃣ Team Presence | Multi-role live workspace (Architect ↔ CFO) | `v0.7.3-collab` |

---

#### 6. Telemetry
- New events: `ux_mode_changed`, `prompt_executed`, `context_switch`, `insight_card_viewed`.
- Purpose: track flow efficiency, learning curve, and engagement triggers.

---

#### 7. Deliverables
- `/src/app/uxshell/UnifiedLayout.tsx`
- `/src/components/prompt/PromptBar.tsx`
- `/src/components/insight/InsightPanel.tsx`
- `/src/components/nav/ModeSelector.tsx`
- `/src/styles/uxshell.css`
- Documentation: `docs/ui/D060_unified_shell.md`

