## Directive 0011: Capability Scoring Workspace 2.0 (Canonical Copy)

**Branch in use:** `feat/d011_capability_workspace_redesign`. Timestamp: 2025-11-26T06:12Z.

### Purpose
Redesign the Capability Scoring Workspace into a guided, structured flow (Import → Score → Visualize) with improved visual hierarchy while keeping full functional parity and data schema compatibility.

### Scope & Targets
- Screens: Capability workspace at `/project/[id]/scoring` (and future `/capabilities`).
- Data: compatible with `.fuxi/data/capabilities.json` and existing capability schemas.
- UX: white-slate minimal, clear sectioning, contextual toolbars, progressive disclosure.

### Plan
1) Header + scope bar (project selector stub, domain filter, progress chips). 
2) Import Panel: dropzone, inline validation, preview stub. 
3) Scoring Panel: capability cards with score chips (gap/neutral/strong), inline actions. 
4) Visualization Panel: simple Recharts (bar/radar) with view toggles. 
5) Empty states and accessibility polish.

### Verification & Validation
| Checkpoint | Description | Status | Verified By | Timestamp |
| --- | --- | --- | --- | --- |
| Workflow Integrity | Import → Score → Visualize operates without dead ends | ☐ | Codex |  |
| Data Schema Compatibility | Existing capability data renders in new UI | ☐ | Fuxi |  |
| UI Consistency | Components follow Fuxi design system (pills, spacing, focus) | ☐ | Mesh |  |
| Empty State UX | Clear onboarding guidance | ☐ | Codex |  |
| Visual Clarity | Hierarchy/spacing verified | ☐ | Fuxi |  |
| Functionality Parity | Legacy scoring actions preserved | ☐ | Codex |  |
| Build Validation | Compiles without errors | ☐ | Mesh |  |

### Notes
- Maintain auth-optional mode per directive (FUXI_AUTH_OPTIONAL=true).
- Keep import/export behavior intact; do not break `.fuxi/data/capabilities.json` shape.
