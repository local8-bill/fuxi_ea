## Directive 014: Verification & Testing Dashboard Framework

### Purpose
Create a unified testing and verification dashboard that consolidates all directive status checks, component validation results, and integration outcomes. The dashboard provides a central view of engineering quality across the Fuxi_EA system.

---

### Objectives
1. Provide a transparent, real-time view of directive progress (✅ ☐) across the repo.
2. Aggregate automated test results from the upcoming D017 testing framework.
3. Track key metrics: build success, schema compatibility, component consistency, and UX validation.
4. Serve as the foundation for future Mesh observability integration.

---

### UX Overview
**Location:** `/project/[id]/verification`

**Layout:**
- **Header:** Project name + status pill (Stable, In Progress, At Risk)
- **Tabs:** Directives | Tests | Components | Summary
- **Directive View:** Table showing Directive ID, Description, Status (✅ ☐ ⚠️), Owner, Branch, Last Updated
- **Testing View:** Pulls results from Vitest/Playwright once D017 is live
- **Component Health:** Flags mismatched versions or missing files
- **Summary Panel:** High-level metrics + overall build health indicator (Good / Needs Review)

---

### Technical Plan (for Codex)
**Branch:** `feat/d014_verification_dashboard`

**Core Files:**
- `src/app/project/[id]/verification/page.tsx` → main dashboard view
- `src/components/verification/DirectiveTable.tsx`
- `src/components/verification/TestResults.tsx`
- `src/components/verification/HealthMeter.tsx`

**Data Sources:**
- `/docs/features/*.md` → directive metadata (parsed via Markdown headers)
- `/tests/results/*.json` → test output feed (to be created under D017)
- `package.json` + git API → build metadata

---

### Design Style
- Reuse Fuxi_EA white-slate minimal aesthetic
- Single-accent highlight for success/warning/failure states
- Consistent use of spacing and typography with dashboard pages
- Inline tooltips for directive context

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Directive Registry | All directives listed and parsed correctly | ☐ | Codex |  |
| Test Sync | Automated test results successfully pulled from D017 output | ☐ | Mesh |  |
| Component Health | UI components validated for version and consistency | ☐ | Fuxi |  |
| Build Status | CI/CD and local builds report correctly | ☐ | Codex |  |
| Dashboard UX | Displays clear summaries without overflow or truncation | ☐ | Fuxi |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-24  
- **Type:** Testing/Observability Directive  
- **Priority:** High  
- **Feature Branch:** `feat/d014_verification_dashboard`  
- **Auth Mode:** Disabled for local (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D014_verification_dashboard.md`