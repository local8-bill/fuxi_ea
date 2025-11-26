## Directive D018: UX Simplification & Human-Factor Rationalization Framework

### Purpose
To define a cognitive and structural framework for simplifying user experience across **Fuxi_EA**, reducing cognitive load and decision friction while maintaining depth and capability. This directive establishes the principles and metrics that will inform subsequent UI testing (Directive D022) and adaptive UX (Directive D020).

---

### Objectives
1. Identify and eliminate unnecessary complexity within each workspace and page.  
2. Define measurable UX metrics: **Cognitive Load**, **Task Friction**, and **Information Density.**  
3. Apply **Page Purpose Rule**: every page must have one clear outcome and no more than three actionable paths.  
4. Create a **Simplification Scoring Model** for components and pages.  
5. Build the foundation for automated cognitive telemetry and human-centered testing.  

---

### Ownership
| Role | Responsibility | Agent |
|------|----------------|--------|
| **Architect** | Define principles, structure, and cognitive ergonomics | Fuxi |
| **Developer** | Implement telemetry hooks, layout metrics, and CLS trackers | Codex |
| **Operator** | Run UI/UX tests and gather observational data | Clu |
| **Platform** | Aggregate telemetry and surface adaptation insights | Mesh |

---

### Framework Overview

#### 1. Cognitive Ergonomics Model
Every page interaction in Fuxi_EA should be optimized around **how users think, decide, and act**.

| Principle | Description | Design Implication |
|------------|--------------|--------------------|
| **Reduce Cognitive Load** | Present only what’s relevant to the task at hand. | Collapsible panels, progressive disclosure, hidden advanced options. |
| **Enable Flow** | Structure interactions in clear sequences with momentum. | Linear task flow, contextual next steps, minimal branching. |
| **Leverage Familiarity** | Anchor UI patterns in common enterprise software metaphors. | Consistent toolbar, modal, and card designs across modules. |
| **Minimize Friction** | Remove redundant clicks, unclear states, or visual noise. | Action proximity (one-click complete actions). |
| **Visual Breathing Room** | Balance whitespace and density to reduce fatigue. | Adaptive grid spacing and vertical rhythm consistency. |

---

#### 2. The Page Purpose Rule
> **Each page serves one cognitive goal.**

| Example | Primary Outcome | Supporting Actions |
|----------|------------------|--------------------|
| **Intake Page** | Capture and validate project inputs | Edit / Save / Continue |
| **Tech Stack Page** | Normalize and view technology assets | Upload / Search / Filter |
| **Digital Enterprise Page** | Analyze systems and integrations | Upload / Refresh / Visualize |
| **Portfolio Page** | Compare and prioritize change scenarios | View Overlaps / Export Summary |

If a page has more than three concurrent decision points or divergent CTAs, it must be split into sub-flows or modals.

---

#### 3. Simplification Scoring Model
A quantitative way to assess how complex or intuitive each page is.

| Metric | Formula | Target |
|---------|----------|--------|
| **Cognitive Load (CL)** | Weighted count of visible interactive elements ÷ task steps | < 0.75 |
| **Task Friction (TF)** | Average time to task completion ÷ ideal flow time | < 1.2 |
| **Information Density (ID)** | Text characters per viewport ÷ cognitive threshold (900) | < 1.0 |
| **Decision Clarity (DC)** | # of CTAs aligned to main task ÷ total CTAs | > 0.6 |
| **Page Simplicity Index (PSI)** | (CL + TF + ID) ÷ DC | ≤ 2.0 |

These metrics will later feed the adaptive UX engine (Directive D020) and automated UI testing (Directive D022).

---

#### 4. Implementation Phases
| Phase | Description | Output |
|--------|--------------|---------|
| **Phase 1: UX Audit** | Tag every page and component with a Simplification Score (manual) | `/docs/ux/simplification_scores.json` |
| **Phase 2: CLS Instrumentation** | Add telemetry hooks to capture live load, friction, and density metrics | `src/hooks/useUXTelemetry.ts` |
| **Phase 3: Design Refactor** | Reorganize pages by purpose (merge, split, or condense) | Simplified navigation map |
| **Phase 4: Testing Integration** | Feed metrics into D022 automated UI tests | Usability baseline reports |

---

### UX Diagnostic Matrix
| UX Symptom | Root Cause | Recommended Fix |
|-------------|-------------|------------------|
| Overwhelming page layout | Too many visible sections | Collapsible panels / tabbed flow |
| User hesitation | Poor task order / unclear next step | Inline progress cues, stronger CTA hierarchy |
| Long task completion | Redundant interactions | Inline edit, keyboard shortcuts |
| Information fatigue | Text-heavy / low contrast | Simplify copy, improve hierarchy |
| Missed actions | CTA placement too far from context | Move actions closer to content |

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Cognitive Load Scoring | Each page receives a Simplification Score | ☐ | Fuxi |  |
| CLS Telemetry Hooks | Telemetry added to core workspaces | ☐ | Codex |  |
| Navigation Flow Review | Page structure conforms to Page Purpose Rule | ☐ | Fuxi |  |
| UX Friction Baseline | Baseline interaction times measured | ☐ | Clu |  |
| Simplification KPI Report | PSI ≤ 2.0 across all workspaces | ☐ | Mesh |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Directive ID:** D018  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** UX Framework  
- **Priority:** High  
- **Feature Branch:** `feat/d018_ux_simplification_framework`  
- **Auth Mode:** Optional (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D018_ux_simplification_framework.md`

