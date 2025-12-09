### Directive D072 – Legacy Harmonization & Transformation Deprecation (Full Implementation Brief)

#### Objective

Fully deprecate the legacy Harmonization Review and Transformation Dialogue pages, consolidating their core logic into the new `/digital-twin/validation` route under the UXShell v0.3 architecture. The new experience introduces anticipatory agent interaction, contextual Pulse telemetry, and guided validation flows — all within the unified design system.

---

### 1. Legacy Scope (to Deprecate)

**Remove / Archive:**

- `/pages/harmonization-review.tsx`
- `/pages/transformation-dialogue.tsx`
- `/components/HarmonizationReview.tsx`
- `/components/TransformationDialogue.tsx`
- `/components/DeltaFeed.tsx`
- `/lib/harmonization/*`
- `/lib/transformation/*`

**Deprecate but Preserve Logic:**

- Key functions for domain matching, confidence scoring, and system deltas to be migrated to `/lib/twin/validation.ts`.

**APIs to Consolidate:**

- `/api/harmonization/status` → `/api/twin/validation/status`
- `/api/transformation/actions` → `/api/twin/validation/actions`

---

### 2. Replacement Experience

**New Route:** `/digital-twin/validation`

**Purpose:** Guide the user through a live, conversational validation process for harmonized systems and integration deltas — replacing static grids with agent-led review.

#### Layout Integration

```jsx
<UXShellLayout>
  <UXShellTopbar fixed />
  <Sidebar />
  <main className="uxshell-content">
    <DigitalTwinValidation />
    <InsightsRail collapsible />
  </main>
</UXShellLayout>
```

**Component Tree:**

```
components/
  - DigitalTwinValidation.tsx        → core validation view
  - ValidationSummaryCard.tsx       → replaces legacy KPI cards
  - ValidationDeltaList.tsx         → dynamic delta rendering
  - ValidationActionChips.tsx       → inline AI decision chips
  - InsightsRail.tsx                → houses ROI Pulse + Agent
```

---

### 3. Core Interaction Flow

| Step                    | Old Function                     | New Behavior                                                                                                             |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **1. Validation Intro** | Static summary banner            | Agent says: *“Here’s the full picture — every system and integration you’ve shared, harmonized across your enterprise.”* |
| **2. Domain Review**    | Static dual-column grid          | Dynamic accordion per domain with AI highlighting duplicates, conflicts, and deltas                                      |
| **3. System Decisions** | Replace/Retire/Modernize buttons | Inline decision chips under each system node                                                                             |
| **4. ROI Impact Sync**  | Manual sync to ROI dashboard     | Pulse updates dynamically after each decision                                                                            |
| **5. Sequencer Prep**   | Manual route switch              | Agent auto-suggests: *“Ready to model this in your Sequencer?”*                                                          |

---

### 4. File Migration Map

| Old File                               | New Destination                          |
| -------------------------------------- | ---------------------------------------- |
| `/lib/harmonization/calcConfidence.ts` | `/lib/twin/validation/calcConfidence.ts` |
| `/lib/transformation/getDelta.ts`      | `/lib/twin/validation/getDelta.ts`       |
| `/lib/harmonization/domainGroups.ts`   | `/lib/twin/validation/domainGroups.ts`   |
| `/components/DeltaFeed.tsx`            | Merged into `ValidationDeltaList.tsx`    |
| `/components/HarmonizationSummary.tsx` | Merged into `ValidationSummaryCard.tsx`  |

---

### 5. API Layer Consolidation

```bash
/api/twin/validation/status
/api/twin/validation/actions
/api/twin/validation/roi-sync
```

**Expected Outputs:**

- `status`: { systems\_found, integrations, confidence\_avg, domains\_detected }
- `actions`: { domain, system, recommendation, ai\_confidence }
- `roi-sync`: auto-triggers Pulse telemetry updates

---

### 6. Telemetry & Agent Integration

| Event                    | Trigger                 | Purpose                                   |
| ------------------------ | ----------------------- | ----------------------------------------- |
| `uxshell_view_selected`  | View load               | Track validation view usage               |
| `agent_intent.triggered` | AI decision prompts     | Measure anticipatory engagement           |
| `pulse_state_change`     | ROI / TCC recalculation | Track live sync performance               |
| `validation_decision`    | User chooses action     | Log Replace / Retire / Modernize outcomes |

---

### 7. QA Checklist

| Check       | Criteria                                                       |
| ----------- | -------------------------------------------------------------- |
| ✅ Routes    | `/harmonization-review` and `/transformation-dialogue` removed |
| ✅ Imports   | No deprecated imports in main bundle                           |
| ✅ UX Layout | Renders inside UXShell v0.3 layout                             |
| ✅ Agent     | Conversational flow active on load                             |
| ✅ Pulse     | ROI Pulse visible + collapsible                                |
| ✅ Telemetry | Events fire correctly in validation flow                       |
| ✅ Build     | All tests passing; bundle size reduced by >8%                  |

---

### 8. Codex Execution Checklist

**Before Commit:**

-

**During Build:**

-

**After Deploy:**

-

---

### 9. Command Bean: cmd\:audit\:ready

**Description:** Runs a full deployment readiness audit verifying route health, layout compliance, telemetry integrity, and bundle metrics.

**Script:** `/scripts/audit_deployment_readiness.js`

**Behavior Summary:**

- Validates route manifest, ensuring legacy routes removed.
- Verifies new APIs return 200 responses.
- Checks telemetry logs for required events.
- Runs static code scan for banned imports.
- Compares bundle size to previous build.

**Integration:**

```json
{
  "cmd:audit:ready": {
    "description": "Verify Fuxi_EA deployment readiness across routes, telemetry, and layout",
    "script": "node ./scripts/audit_deployment_readiness.js"
  }
}
```

**Pass Criteria:**

| Check                 | Threshold                                                |
| --------------------- | -------------------------------------------------------- |
| Route Validation      | `/digital-twin/validation` exists                        |
| Legacy Routes Removed | No `/harmonization-review` or `/transformation-dialogue` |
| API Status            | All `/api/twin/validation/*` return 200                  |
| Telemetry             | ≥3 required events recorded                              |
| Bundle Delta          | < 8% growth                                              |

---

### 10. Success Outcome

When executed, this directive ensures:

- One cohesive, guided validation experience.
- Zero legacy UX or redundant routes in production.
- Full alignment with D066D (Topbar), D067 (Conversational Onboarding), and D070B (Digital Twin View).
- The Fuxi demo environment runs entirely on the UXShell v0.3 framework with no deprecated layout elements or redundant agents.
- Automated audits confirm readiness before every demo or deployment.

