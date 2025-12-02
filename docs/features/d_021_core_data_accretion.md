## Directive D021: Core Data Pack + Continuous Data Accretion Model

### Purpose
To define the foundational data model and continuous ingestion behavior for Fuxi_EA projects, enabling users to begin with incomplete data and progressively enrich their workspace over time. This directive ensures data growth, traceability, and adaptability across all five workspaces defined in D020.

---

### 1. Core Data Pack

The Core Data Pack represents the essential datasets required for meaningful analysis and modeling within Fuxi_EA. Each dataset type maps to a specific workspace and supports multi-source ingestion.

| Data Type | Description | Example Sources | Workspace Alignment |
|------------|--------------|------------------|--------------------|
| **Spend** | Technology spend across organization, including shadow IT | Financial systems, CSV exports, PowerBI extracts | Portfolio, Insights |
| **Labor** | FTEs and contractors by department, location, and project | HRIS, Org charts, Excel | Intake, Portfolio |
| **Procurement/Vendor** | Vendor lists, managed services, contract details | Procurement systems, PDF uploads | Tech Stack, Portfolio |
| **Project Portfolio** | Budgetary classifications for run, protect, change | PPM tools, Excel, Jira | Portfolio |
| **Application Portfolio** | Application inventory and metadata | CMDB, ServiceNow, App inventory spreadsheets | Tech Stack, Digital Enterprise |
| **Infrastructure Portfolio** | Servers, networks, utilization data | Datacenter CMDB, Excel, APIs | Tech Stack, Digital Enterprise |
| **Cloud Portfolio** | Cloud instances, apps, and costs | AWS/Azure/GCP exports | Tech Stack, Portfolio |
| **Mainframe Consumption** | Usage data by system type and timing | Legacy logs, CSVs | Tech Stack, Digital Enterprise |

---

### 2. Continuous Data Accretion Flow

Users can upload, append, or update any dataset at any time without restarting the project. The system continuously learns and adapts as data grows.

#### Flow:
1. User uploads or links a new dataset.
2. System validates format and schema.
3. New data merges into the existing workspace context.
4. Related models and visualizations automatically update.
5. User receives a summary of changes and impacts.

Example prompt:  
> "New Labor data detected — 12 records match existing application mappings. Apply updates to Portfolio and Insights?"

---

### 3. Validation & Propagation

Each data upload triggers automated validation steps:
- **Schema check:** Ensure headers and fields match expected structure.
- **Integrity check:** Detect duplicates or missing keys.
- **Join mapping:** Auto-link data (e.g., Labor to Applications via Project ID).
- **Propagation:** Update dependent graphs, charts, and scenarios.

All validations are logged in a **Data Lineage Ledger**, capturing:
- Source name
- Upload timestamp
- Records added/updated
- Downstream components affected

---

### 4. Completeness Feedback

The system calculates a dynamic **Data Completeness Score** across all workspaces:
- Percentage of required datasets loaded.
- Schema conformity.
- AI confidence in correlations between datasets.

Users see a live **Completeness Meter** (e.g., 68% → missing Cloud + Vendor data).  
As new data arrives, completeness automatically recalculates, unlocking new analysis features.

---

### 5. UX Implications

#### Progressive Engagement
- Users never face a blank form — they start with whatever they have.
- Missing data appears as *opportunities*, not *errors*.

#### Smart Prompts
- If repeated updates occur for a dataset, the system suggests linking to a live data source.

#### Contextual Feedback
- Example: "We’ve improved ROI confidence by 22% since your last upload."

#### Audit & Traceability
- Every action is tracked, showing exactly how insights evolve as data matures.

---

### 6. Cognitive Continuity & Simplification Link (D019)

The Continuous Data Accretion model supports adaptive UX by aligning with cognitive state telemetry:
- Users adding new data trigger recalibration of UI complexity (e.g., more visualization unlocked).
- High hesitation or idle time prompts simplification (“Start with Spend data only”).

---

### 7. Verification & Validation Table

| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Core Data Types Defined | All key datasets listed and aligned to workspaces | ☐ | Fuxi | |
| Accretion Pipeline Active | Upload → Merge → Propagation flow functional | ☐ | Codex | |
| Completeness Meter Linked | Real-time score visible in UI | ☐ | Mesh | |
| Telemetry Integration | Adaptive behavior responding to data maturity | ☐ | Clu | |
| Lineage Ledger Operational | Audit trail logging data additions | ☐ | Fuxi | |

---

**Directive Metadata**
- **Project:** Fuxi_EA
- **Directive ID:** D021
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-26
- **Type:** Data Model / UX Behavior
- **Priority:** High
- **Feature Branch:** `feat/d021_core_data_accretion`
- **Next Step:** Extend to Simplification Strategy (D021b) for cognitive-stage adaptive interfaces.

