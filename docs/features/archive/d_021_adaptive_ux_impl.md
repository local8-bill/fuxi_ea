## Directive D021: Adaptive UX Implementation Spec (Codex Build Instructions)

### ⚠️ Implementation Boundaries — Telemetry (From D020)
> Until the Fuxi_EA UI has reached visual and interaction lock:  
> - **Do not** migrate telemetry persistence from `.fuxi/data/telemetry_events.ndjson` to SQLite or any other DB.  
> - **Do not** enforce `FUXI_API_TOKEN` or introduce auth/rate-limit logic on `/api/telemetry`.  
> - Maintain local persistence and dev-open behavior for telemetry events.  
> - Schema validation, event consistency, and Simplification Score integration remain in scope.  
> - These constraints will be revisited post–UI freeze in **Directive D025: Secure Data Transition**.

---

### 🎯 Purpose
Transform the high-level UX journey map (D020) into **live adaptive interfaces** that modify layout, guidance, and AI prompts based on telemetry data and user context.

This directive gives Codex step-by-step UI implementation specs: layouts, state logic, and adaptive triggers per workspace.

---

### 1. **UX Foundations**

Each workspace must:
- Display only relevant tools and guidance based on **current goal** and **data completeness**.  
- Offer progressive disclosure: start simple → expand as the user provides context.  
- Trigger contextual AI assist prompts (using local reasoning model or API) when telemetry detects:
  - Long idle (>30s)
  - Frequent reversals (e.g., deleting uploads)
  - Low Simplification Score

#### Layout Behavior
| Element | Behavior | Trigger |
|----------|-----------|---------|
| **Context bar** | Shows current objective and last saved progress | Always visible, updates on save |
| **AI Assist Panel** | Hidden by default, slides in when assistance triggered | Idle, error, or incomplete state |
| **Next-step CTA** | Enabled when completion criteria met (defined per workspace) | Telemetry-driven |
| **Progress bar** | Smoothly updates with workspace completion % | Derived from telemetry events |

---

### 2. **Adaptive UX Rules per Workspace**

#### 🧭 Intake
- **Primary goal:** Define project intent.  
- **Adaptive features:**  
  - If `form_idle_time > 45s`, show subtle AI tip: *“Need help clarifying your objectives?”*  
  - If `validation_error > 2`, highlight incomplete sections and suggest “auto-fill from previous projects” (mock assist).  
  - Display summary card once all mandatory fields valid.  
- **Success condition:** `intake_summary_view` event fired.

#### 🧱 Tech Stack (Ecosystem)
- **Primary goal:** Normalize uploaded systems and categorize.  
- **Adaptive features:**  
  - After first upload, automatically switch from Upload View → Table View → Graph View (progressive reveal).  
  - Detect duplicate names via AI; highlight overlapping entries in yellow.  
  - Add “confidence” gauge (from Simplification Score):  
    - 0–0.5 🔴 “Needs normalization”  
    - 0.5–0.8 🟡 “Mostly aligned”  
    - 0.8–1.0 🟢 “Clean ecosystem”  
- **Success condition:** `normalize_edit` + `upload_complete` events confirm ≥90% unique entries.

#### 🌐 Digital Enterprise
- **Primary goal:** Visualize relationships.  
- **Adaptive features:**  
  - Graph view loads with **layered depth**: Domains → Systems → Integrations.  
  - If node/edge count > threshold, automatically collapse domains and show summary cards.  
  - Add “AI Analysis” button that reads topology → proposes integration risks.  
- **Success condition:** `graph_load` + `edge_trace` logged with ≥1 integration explored.

#### 💼 Portfolio
- **Primary goal:** Compare scenarios and trade-offs.  
- **Adaptive features:**  
  - When multiple scenarios exist, auto-populate comparison grid.  
  - Use Simplification Score trends to color-code outcomes (e.g., red = complexity increase).  
  - Show a slider (cost vs efficiency) with telemetry logging param adjustments.  
- **Success condition:** `simulation_complete` + `scenario_compare_view` fired.

#### 💡 Insights
- **Primary goal:** Deliver actionable outcomes.  
- **Adaptive features:**  
  - Insight cards grouped by impact area (Cost, Risk, Efficiency).  
  - Telemetry tracks which recommendations are expanded → reorders future priority suggestions.  
  - “Export summary” disabled until user interacts with ≥1 insight card.  
- **Success condition:** `export` event + “insight_consumed” tag logged.

---

### 3. **Telemetry-to-UX Feedback Loop**

- Telemetry hook (`useTelemetry`) triggers adaptive UI updates:
  ```ts
  useEffect(() => {
    if (event.type === "form_idle" && event.data.idle_time > 45) {
      setShowAssist(true);
    }
  }, [event]);
  ```
- Map telemetry event streams to Simplification Score:
  - **Score formula:** `(completions / total_interactions) * (1 - error_rate)`
  - Display in header as adaptive color bar.

---

### 4. **UI Integration Targets**

| Workspace | File Target | Component |
|------------|--------------|------------|
| Intake | `src/app/project/[id]/intake/page.tsx` | `IntakeClient` |
| Tech Stack | `src/features/tech-stack/ModernizationImportPanel.tsx` | `EcosystemClient` |
| Digital Enterprise | `src/app/project/[id]/digital-enterprise/DigitalEnterpriseClient.tsx` | `GraphView` |
| Portfolio | `src/app/project/[id]/portfolio/page.tsx` | `ScenarioStudioClient` |
| Insights | `src/app/project/[id]/insights/page.tsx` (placeholder) | `InsightView` |

---

### ✅ Verification Table

| Checkpoint | Description | Status | Verified By |
|-------------|--------------|--------|--------------|
| Progressive UX flow works across all workspaces | Users see adaptive CTAs and prompts | ☐ | Codex |
| Simplification Score integrated with telemetry events | Adaptive color/status correct | ☐ | Codex |
| AI Assist triggers at correct thresholds | Idle/low-score scenarios | ☐ | Fuxi |
| Telemetry payload schema validated | No malformed logs | ☐ | Mesh |
| Dev mode isolation maintained | No FUXI_API_TOKEN enforcement | ☐ | Clu |

---

### 🧩 Implementation Readiness Checklist

| Task | Description | Status |
|------|-------------|--------|
| 1. UI State Hooks Ready | Ensure each workspace has local UI state to toggle context bar, assist panel, and CTA | ☐ |
| 2. Telemetry Hook Integrated | Attach `useTelemetry()` and verify event capture consistency | ☐ |
| 3. Simplification Score Placeholder | Add Simplification Score computation stub with color logic | ☐ |
| 4. Idle Detection Logic | Implement idle tracking for Intake/Tech Stack (45s threshold) | ☐ |
| 5. AI Assist Trigger Test | Simulate assist prompts based on telemetry | ☐ |
| 6. Progressive Disclosure Layout | Validate hiding/unhiding sections per state | ☐ |
| 7. Success Signal Validation | Ensure success event logged per workspace | ☐ |
| 8. Visual QA | Confirm adaptive color and CTA states render as expected | ☐ |

---

**Directive Metadata**  
- **Project:** Fuxi_EA  
- **Directive ID:** D021  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-27  
- **Type:** UX Implementation Spec  
- **Priority:** Critical  
- **Feature Branch:** `feat/d021_adaptive_ux_impl`  
- **Next Step:** Implement adaptive interface logic; verify telemetry integration and Simplification Score bindings.

