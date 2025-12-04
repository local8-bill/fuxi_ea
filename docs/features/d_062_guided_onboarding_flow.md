# D062: Guided Project Onboarding Flow

## Objective
Design the first-time user experience for architects and transformation leaders using Fuxi_EA. The flow is conversational and guided, leading users from project creation to the first analytical workspace. Later interactions transition into the modular UX shell for experienced users.

---

## 1. Entry Point: Home Screen
**Context:** User lands on a clean home view.

**Elements:**
- Welcome message (e.g., "Welcome back, ready to explore your enterprise?")
- Primary CTA: **Create Project**
- Secondary: Access existing projects or continue previous session.

---

## 2. Project Creation Wizard
**Prompt:** "Let's get started — tell me about your project."

**Fields:**
- Project Name
- Project Role (Architect, Analyst, CIO, FP&A Manager)

**System Response:** Acknowledges input and transitions to project intake.

---

## 3. Project Intake
**Prompt:** "What’s the goal of this project?"
- Goal options: Modernize, Optimize, Transform
- Pace options: Aggressive, Moderate, Conservative

**System Behavior:** Saves metadata, sets default parameters for cost/ROI calculations.

---

## 4. System Prompt: Starting Point
**Prompt:** "Where would you like to start?"
**Options:**
- Define my tech stack
- Assess ROI
- Analyze harmonization
- Build my roadmap
- Visualize digital twin

**Behavior:**
- Conversational, card-based responses.
- Clicking an option advances to the relevant workspace onboarding.

---

## 5. Define My Tech Stack
**System Prompt:** "Do you have existing artifacts you’d like to use or analyze?"
**Choices:**
- Yes → Artifact Upload & Verification
- No → Open guided builder canvas to create tech stack manually

---

## 6. Artifact Upload & Verification
**Supported Artifacts:** CSV, Excel, PPT, PDF, Images
**Process:**
- Upload screen with drag/drop zone
- File type auto-detected
- Previews auto-generated:
  - CSV/Excel → data grid + detected fields
  - PPT/PDF/Image → OCR + visual preview

**System Prompt:** "We’ve identified potential artifacts — please verify their type."
**User Response:** Marks as one of: Inventory / Current State / Future State

---

## 7. System Interpretation
**Process:**
- Harmonization runs automatically.
- Graph and metadata built in background.

**System Message:**
> "Here’s what we found. What would you like to do next?"

**Options:**
- Identify mismatches or naming issues
- Compare current vs. future state
- Estimate cost & ROI
- Sequence transformation

---

## 8. Workspace Launch (User Selection)
- Redirect user to corresponding workspace:
  - **Harmonization Review**
  - **Transformation Sequencer**
  - **ROI Dashboard**
  - **Ecosystem View (Graph)**

System maintains conversational tone: "Got it — let’s look at your harmonization data."

---

## 9. Session Continuity
- System remembers last visited workspace and project context.
- On next login:
  > "Would you like to continue where you left off with Project X?"

---

## 10. Transition to Modular UX Shell
Once onboarding completes, user lands in full UX Shell (D060):
- Left navigation expands to modular views (Projects, Views, Modes, ROI, Graph, Sequencer, etc.)
- Guided chat remains as collapsible assistant sidebar.
- Telemetry starts tracking contextual user behavior (e.g., `onboarding_completed`, `project_created`, `artifact_verified`).

---

## Implementation Notes
- UI built as progressive chat interface.
- Store onboarding progress in localStorage/project profile.
- Use same telemetry hooks as ROI dashboard.
- Voice-friendly script ready for AI-guided future iteration.

---

## Next Steps
1. Implement conversational onboarding UI in `/pages/onboarding.tsx`.
2. Connect upload pipeline to harmonization API.
3. Wire telemetry to onboarding milestones.
4. Add state flag `user.onboarding_complete` → unlocks UX shell.
5. Draft UX mockup for guided → modular transition screen.

