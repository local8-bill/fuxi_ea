## Directive D031 — Lucid Integration Roadmap (Strategic Placement)

### Purpose
Define the near-term and long-term strategy for diagram ingestion.  
Focus current development on *value creation for architects* (data harmonization, insight generation) while establishing Lucid integration as a **future accelerator**, not a dependency.

---

### Current Product Focus (Now → D034)
**Goal:** Help users see their architecture *as one coherent ecosystem*, regardless of messy input formats.

| Step | User Action | Fuxi_EA Capability |
|------|--------------|-------------------|
| 1 | Upload artifacts (Excel, PPT, CSV, PNG, JSON) | Unified ingest pipeline (`/api/mre/artifacts`) extracts systems + domains. |
| 2 | Harmonize naming and domains | Normalization engine (D026/D027). |
| 3 | Detect integrations (when present) | Parse relationships in data and Lucid CSVs. |
| 3a | Manually add integrations | Interactive canvas for “connect system → system.” |
| 4 | Add future-state diagram | Harmonization engine compares and flags deltas. |
| 4a | Disposition obsolete systems | Inline actions (Retire / Replace / Keep). |
| 4b | Visualize impact | DE view shows integrations, systems, and cost ripple. |
| 5 | Apply intent | Modernize / Optimize / AI-Readiness → scenario templates. |
| 6 | Generate business insights | Portfolio + Insights workspaces. |

🟢 **Immediate “wow”:** upload → unified ecosystem → gap/overlap/impact visualized.  
🟡 **Deliberate trade-off:** manual or partial Lucid ingestion now, full API later.

---

### Lucid Integration Roadmap

| Phase | Goal | Description |
|--------|------|-------------|
| **Phase 1 (Now)** | *Manual Lucid Support* | Accept Lucid CSV/JSON exports, filter out noise, extract systems + edges. (D026–D029). |
| **Phase 2 (Future)** | *Lucid API Ingestion (D030)* | One-click API connection for direct diagram import. Uses Lucid’s REST endpoint with short-lived token (manual entry). |
| **Phase 3 (Later)** | *Lucid OAuth (D031.2)* | “Connect your Lucid Account.” Secure OAuth 2.0 with read-only scopes. Automatic refresh. |
| **Phase 4 (Mesh-level)** | *Enterprise Connect* | Mesh brokers all 3rd-party integrations (Lucid, Miro, Jira, etc.). Tokens managed centrally. Fuxi_EA requests harmonized diagrams on demand. |

---

### Key Principle
> **Render Value Before Rendering the Diagram.**  
> Architects don’t care how the data got there — they care that it’s accurate, unified, and actionable.

---

### Verification Table

| Checkpoint | Description | Status | Verified By |
|-------------|--------------|--------|-------------|
| Harmonization Baseline | Current upload-to-view path works across file types | ☑ | Codex |
| Lucid API Harness | Basic script tested manually | ☑ | Fuxi |
| Lucid OAuth Flow | Deferred; added to roadmap | ☐ | Mesh |
| Manual Integration Canvas | Planned (D033) | ☐ | Fuxi |
| Business Outcomes Mapping | “Modernize / Optimize / AI Readiness” scenarios functional | ☐ | Fuxi |

---

### Directive Metadata

- **Project:** Fuxi_EA  
- **Directive ID:** D031  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-28  
- **Type:** Roadmap / Product Strategy  
- **Feature Branch:** `feat/d031_lucid_integration_roadmap`  
- **Priority:** Medium (strategic)  
- **Next Step:** Maintain manual ingestion + harmonization as core; backlog Lucid API + OAuth.

