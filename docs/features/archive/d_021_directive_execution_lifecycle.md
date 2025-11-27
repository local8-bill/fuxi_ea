## Directive D021: Directive Execution Lifecycle (DEL) Framework

### Purpose
Establish a unified lifecycle model for all **Fuxi_EA** directives that governs how each feature directive moves through creation, implementation, testing, and archival. This ensures that all work in the project is verifiable, observable, and historically traceable.

**Status:** ✅ Completed

---

### Objectives
1. Standardize the Directive lifecycle across all agents and subsystems.  
2. Create a JSON schema for directive test result reporting.  
3. Automate directive status transitions (Draft → Implemented → Verified → Completed → Archived).  
4. Enable dashboard visibility for all lifecycle stages.  
5. Implement a consistent archival protocol for completed directives.

---

### Lifecycle Phases

| Phase | Description | Responsible Agent | Output |
|--------|--------------|-------------------|---------|
| **Plan** | Directive is authored and approved. | Fuxi (Architect) | `/docs/features/DXXX_feature_name.md` |
| **Build** | Codex implements the directive and commits code. | Codex (Developer) | Feature branch + implementation logs |
| **Verify** | Automated tests validate directive logic and UI behavior. | Clu (Ops/Test Agent) | `/tests/results/DXXX.json` |
| **Observe** | Dashboard reads test results and updates directive status. | Mesh (System) | Updated status in dashboard |
| **Reflect** | Fuxi reviews test outcomes, tags directive as `✅ Completed`. | Fuxi (Architect) | Verified directive file |
| **Archive** | Completed directive moved to `/docs/archive/` with metadata. | Mesh (System) | Archived .md with YAML metadata |

---

### Directive Test Result Schema
Each directive writes a test result feed to `/tests/results/` in JSON.

```json
{
  "directive_id": "D017",
  "directive_title": "Automated Testing Framework Setup",
  "status": "verified",
  "timestamp": "2025-11-26T13:30:00Z",
  "test_suites": [
    {
      "name": "Framework Initialization",
      "tests": [
        { "test_name": "Build config loads", "status": "pass" },
        { "test_name": "Vitest runner starts", "status": "pass" }
      ]
    }
  ]
}
```

The dashboard parses all files matching `/tests/results/D*.json` to compute directive health.

---

### Status Transition Rules

| From | To | Trigger | Validation |
|------|----|----------|-------------|
| `Draft` | `Implemented` | Code committed in feature branch | Git hook event |
| `Implemented` | `Verified` | Tests in `/tests/results/` show ≥80% pass | Mesh Test Parser |
| `Verified` | `Completed` | Fuxi manual review / Codex auto-tag | Directive updated with `Status: ✅ Completed` |
| `Completed` | `Archived` | Mesh archival automation detects completion | Archive Protocol below |

---

### 🗂️ Archival Protocol
Once a directive’s `Status` is set to `✅ Completed`, the Mesh system automatically moves it to `/docs/archive/`.

#### Archival Steps
1. Copy the directive file to `/docs/archive/`.
2. Append YAML metadata:

```yaml
# Archive Metadata
archived_on: 2025-11-26
archived_by: "EA Mesh (GPT-5)"
verified_in_branch: "main"
test_suite_reference: "/tests/results/DXXX.json"
notes: "Directive completed and verified under testing framework D017."
```

3. Remove or hide the directive from `/docs/features/` dashboard listing.  
4. Display archived directives under “Archive View” with read-only mode.

---

### Dashboard Integration Rules
- **Active Directives:** Visible in primary dashboard view, filterable by `status` and `priority`.
- **Archived Directives:** Accessible via Archive View tab, read-only.
- **Status Colors:**  
  - 🟡 Draft  
  - 🟠 Implemented  
  - 🔵 Verified  
  - ✅ Completed  
  - 🗂️ Archived

---

### Automation Hooks
- **Codex Hook:** Adds or updates `Status:` field in directive header upon successful merge.
- **Clu Hook:** Publishes test results to `/tests/results/` directory.  
- **Mesh Hook:** Monitors status field → triggers archival move + metadata append.  
- **Dashboard Parser:** Refreshes view every 60s, scanning `/docs/features/` and `/docs/archive/`.

---

### Verification & Validation Table

| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Directive Status Parsing | Dashboard recognizes and parses all status tags | ☐ | Mesh |  |
| JSON Test Feed Validation | `/tests/results/*.json` validated against schema | ☐ | Clu |  |
| Auto Archival | Completed directives move automatically to `/docs/archive/` | ☐ | Mesh |  |
| Metadata Append | Archive metadata block correctly written | ☐ | Codex |  |
| Dashboard Refresh | Archive view updates without errors | ☐ | Mesh |  |
| Search Index | Archived directives excluded from active search | ☐ | Mesh |  |

---

### Directive Metadata
- **Project:** fuxi_ea  
- **Directive ID:** D021  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** Governance Framework  
- **Priority:** High  
- **Feature Branch:** `feat/d021_directive_execution_lifecycle`  
- **Auth Mode:** Optional (FUXI_AUTH_OPTIONAL=true)  
- **Next Step:** Save to `/Users/local8_bill/Projects/fuxi_ea/docs/features/D021_directive_execution_lifecycle.md`
