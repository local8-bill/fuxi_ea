## 🧭 Directive D070 – Demo Readiness Consolidation (Fuxi_EA v0.7.3 → v0.7.4)

### Purpose
This directive consolidates all active workstreams, ensures stability across implemented directives, and establishes D068 (Enterprise Harmonization Flow) as the final integration step required to deliver a seamless architect-focused demo experience.

The goal: **lock the product for demo readiness** — no new features, only refinement, orchestration, telemetry, and polish.

---

### 1️⃣ Current Directive Status Overview
| Directive | Status | Stability | Demo Visibility | Notes |
|------------|---------|------------|------------------|--------|
| D060 (UX Shell) | ✅ Implemented / polish required | ⚙️ Minor quirks | 🟢 High | Sidebar width locked; toggle order + top-bar icons pending refinement. |
| D061 (Playwright UAT Layer) | ✅ Stable | 🟢 High | 🟡 Medium | Tests passing; add tone/telemetry cases per QA checklist. |
| D062 (Guided Onboarding) | ✅ Implemented | 🟢 High | 🟢 High | Conversational onboarding connected to agent API. |
| D065 (Conversational Mandate) | 🟡 Partial | 🟡 Moderate | 🟢 High | Will reach parity post D069 tone rollout. |
| D066 (UXShell Hotfixes) | ✅ Layout fixed / UX pending | ⚙️ Minor | 🟢 High | Icons and left-rail click refinement ongoing. |
| D067 (Conversational Onboarding) | ✅ Hooked to API | 🟢 High | 🟢 High | Persistent intents JSON optional but beneficial. |
| D068 (Enterprise Harmonization Flow) | 🟡 Not implemented | ⚠️ Low | 🔴 Critical | Priority #1 for demo. |
| ROI / Sequencer (D051–D053) | ✅ Core stable | 🟢 High | 🟢 High | Integrate agent narration and adaptive tone (D069). |
| Graph (D037/D041/D047A) | ✅ Functional | ⚙️ Minor flicker | 🟢 High | Implement timing gating for visual calm. |
| Transformation Sequencer (D034/D040) | 🟡 Partial | ⚠️ Moderate | 🟢 High | Dependent on D068 harmonization integration. |
| DB Integration Sprint Plan | ❌ Not implemented | 🚧 | 🟡 Low | Deferred post-demo. |

---

### 2️⃣ Demo-Critical Work Priorities
| Priority | Action | Directive(s) | Owner |
|-----------|---------|---------------|--------|
| 1️⃣ | Implement and stabilize Enterprise Harmonization Flow | D068 | Codex Dev |
| 2️⃣ | Finalize UXShell polish (sidebar toggles, icons) | D060, D066B/C | Frontend / UX |
| 3️⃣ | Integrate Adaptive Tone & Timing Layer | D069, D069-A, D071-B | Agent / Frontend |
| 4️⃣ | Wire Persistent Intents JSON for continuity | D067 | Backend |
| 5️⃣ | Execute QA + Flow Evolution cycle | D061, QA Checklist | QA / PM |

---

### 3️⃣ Pending Local Changes (Pre-Push)
| File | Status | Notes |
|-------|---------|-------|
| `package.json` | ✅ Modified | Include updated test deps and scripts. |
| `playwright.config.ts` | ✅ Updated | Ensures traces and videos always recorded. |
| `scripts/collect_playwright_videos.js` | ⚙️ New | Centralizes demo artifact collection. |
| `playwright-report/`, `test-results/` | ⚠️ Generated | Add to `.gitignore` before commit. |

**Next Step:** Push branch `feature/demo_v0.7.3-prep` once verification passes.

---

### 4️⃣ Deliverables Before Demo Freeze
| Deliverable | Directive | Status |
|--------------|------------|---------|
| Harmonization Flow Implemented | D068 | ☐ |
| Sidebar/Topbar Polished | D060 / D066 | ☐ |
| Agent Tone Adaptive | D069 / D069-A / D071-B | ☐ |
| Persistent Intents File | D067 | ☐ |
| QA Cycle Complete | D061 | ☐ |
| Telemetry Integration Complete | D071-B | ☐ |
| Demo Flow Signed Off | D070 | ☐ |

---

### 5️⃣ QA & Flow Evolution Cadence
| Phase | Owner | Deliverable | Frequency |
|--------|--------|--------------|------------|
| QA / Conversational Analysis | QA Lead | Session tone + timing report | Weekly |
| PM Review | PM | Flow Evolution Report | Bi-weekly |
| Codex Dev | Dev Lead | Implementation updates | Bi-weekly |
| UX / PM Sync | Joint | Demo prep alignment | Weekly until demo freeze |
| Data / QA | Data Eng | Telemetry review | Weekly |

---

### 6️⃣ Success Criteria for Demo Readiness
✅ Harmonization Flow implemented and stable under live walkthrough.  
✅ All UXShell and sidebar visuals consistent with ChatGPT-style interface.  
✅ Agent tone and timing adaptive, mirroring user phrasing naturally.  
✅ Telemetry logs show tone stability >90% and pacing variance <10%.  
✅ QA confirms tone, timing, and UX pacing match directives D068–D071-B.  
✅ No regressions in Playwright, ROI, or Sequencer layers.  
✅ Demo rehearsal approved by Architecture Review Board.

---

### 7️⃣ Telemetry Integration & Validation

**Purpose:** Ensure conversational performance metrics (tone, pacing, engagement) are active and validated for the demo.  
**Source Directive:** D071-B (Tone Telemetry & Observability)

#### Key Logs
| Log File | Description |
|-----------|--------------|
| `/data/telemetry/tone_behavior.log` | Raw event stream per message. |
| `/data/analytics/tone_performance.json` | Aggregated performance metrics. |
| `/data/analytics/conversation_behavior.json` | Cross-feature interaction analysis. |

#### Validation Checks
| Metric | Threshold | Owner |
|---------|------------|--------|
| Tone Stability Index | ≥ 90% | QA |
| Pacing Variance | ≤ 10% | QA / Codex |
| User Interruption Rate | ≤ 5% | PM Review |
| Response Latency Average | ≤ 4s | QA |

#### Expected Outcome
- Tone telemetry active in live demo environment.  
- QA dashboard visualizing tone metrics.  
- Performance validated against D071-B thresholds.  
- Logs persisted and versioned with demo artifacts.

---

### 📦 Release Plan
- Branch: `feature/demo_v0.7.3-prep`  
- Target release: `v0.7.4-demo-ready`  
- Next Directive milestone: `D071 – Navigation & Home` + `D071-B Tone Layer Integration`  

**Owner:** Product Management / UX / Codex Dev / QA  
**Status:** 🚀 Active and in demo-readiness phase

