## 🎬 Directive D070-A – Demo Scenario Playback Validation

### Purpose
This sub-directive to D070 defines the end-to-end validation process for the **Architect Demo Happy Path**, ensuring that every step — from onboarding to export — functions in sequence, in real time, and with synchronized conversational tone, visual timing, and system feedback.

This validation phase confirms that Fuxi_EA performs flawlessly under live demo conditions and mirrors the intended narrative flow defined in D068 (Enterprise Harmonization Flow) and D069 (Agent Tone Standards).

---

### 1️⃣ Objectives
1. Validate the **full architect journey** (onboarding → harmonization → sequencing → ROI → export).
2. Ensure **timing, tone, and transitions** match Directive D069 pacing standards.
3. Confirm **agent mirroring** and adaptive phrasing accuracy per Addendum D069-A.
4. Verify **no regressions** in navigation, telemetry, or visual coherence.

---

### 2️⃣ Demo Playback Environment
| Component | Requirement | Notes |
|------------|--------------|--------|
| **Branch** | `feature/demo_v0.7.3-prep` | Locked during validation. |
| **Environment** | Staging build with full telemetry logging. | Simulate live demo latency. |
| **Telemetry** | `/data/sessions` + `/data/analytics/behavioral_analytics.json` | Capture tone + timing deltas. |
| **Browser Setup** | Chrome + Playwright trace recording enabled. | Ensure trace and video output. |
| **Hardware** | Standard demo laptop / dual-screen. | One screen for app, one for notes. |

---

### 3️⃣ Playback Validation Steps

#### Step 1 – Session Launch
- Action: Load app → Agent initiates onboarding.
- Expectation: Smooth fade-in, no layout flicker.
- Validate telemetry: `onboarding_loaded` fired.

#### Step 2 – Platform Context Capture
- Action: Select 3–5 platforms (ERP, Finance, Data).
- Expectation: Sidebar badge updates; agent repeats user phrasing accurately.
- Validate telemetry: `conversation_context_updated` logged.

#### Step 3 – Upload Phase
- Action: Upload current + future state files.
- Expectation: Upload progress smooth; agent confirms tagging.
- Validate telemetry: `ingestion_completed` logged; tone = neutral.

#### Step 4 – Harmonization Visualization
- Action: Agent opens Digital Enterprise Graph.
- Expectation: Graph renders fully before narration resumes.
- Validate telemetry: `harmonization_completed` logged; tone = advisory.
- UX cue: No flicker or redraw mid-speech.

#### Step 5 – Sequencing Dialogue
- Action: Agent introduces modernization waves.
- Expectation: Smooth transition; no overlap with graph animation.
- Validate telemetry: `sequencing_generated` logged; tone = advisory/neutral.
- Confirm response delay matches +2s rule (per D069 Timing Table).

#### Step 6 – ROI Review
- Action: Agent loads ROI dashboard with platform filters.
- Expectation: Charts animate sequentially; narration resumes post-motion.
- Validate telemetry: `roi_summary_displayed` logged; tone = strategic.

#### Step 7 – Export & Close
- Action: Agent prompts export; user confirms.
- Expectation: Export success toast within 2s; session archived.
- Validate telemetry: `session_completed` logged; tone = conclusive.

---

### 4️⃣ Timing Validation Metrics
| Event | Expected Delay | Validation Source |
|--------|----------------|-------------------|
| Graph Render → Narration | 2000 ms | Playwright trace timestamps |
| Chart Load → Speech Resume | 1500 ms | Video + logs |
| Upload Confirmation → Prompt | 1000 ms | Console log review |
| Step Transition → Agent Speech | 1000 ms | Session telemetry |

**Rule:** Agent speaks *only after* all movement stops — verified by animation completion event.

---

### 5️⃣ Tone & Phrasing Audit
| Phase | Expected Tone | Verification Method |
|--------|----------------|---------------------|
| Onboarding | Neutral | Transcripts vs. D069 templates |
| Harmonization | Analytical | Conversation diff analysis |
| Sequencing | Advisory | Phrasing keyword check |
| ROI | Strategic | Lexical tone evaluation |
| Export | Conclusive | End-of-session summary check |

QA will verify that at least **95% of messages** conform to expected tone category and adaptive phrasing rules.

---

### 6️⃣ Visual Rhythm Validation
| Checkpoint | Requirement |
|-------------|-------------|
| **Sidebar** | No drift or toggle lag; consistent width per D066B. |
| **Graph View** | No flicker; fade transition smooth <200ms. |
| **ROI Dashboard** | Charts animate in sequence, not simultaneously. |
| **Prompt Bar** | Input area remains responsive throughout playback. |

---

### 7️⃣ Regression Check
Run all Playwright suites (`tests/e2e/*.spec.ts`) and ensure:
- ✅ 100% pass rate.  
- ✅ No new warnings or errors.  
- ✅ Video + trace stored in `/playwright-report`.

---

### 8️⃣ QA & PM Sign-off
| Role | Responsibility | Signature |
|-------|----------------|------------|
| QA Lead | Validate telemetry, timing, and tone adherence. | ☐ |
| PM | Confirm narrative consistency and demo polish. | ☐ |
| Dev Lead (Codex) | Confirm no regressions, performance stable. | ☐ |
| UX | Verify visual rhythm, animation smoothness. | ☐ |

---

### ✅ Success Criteria
- All demo steps complete without error or visual lag.  
- Agent tone, phrasing, and timing align with D069/D069-A standards.  
- Telemetry validates pacing and tone within tolerance thresholds.  
- Session replay demonstrates full cognitive continuity.  
- QA + PM sign off demo as **v0.7.4-demo-ready.**  

---

### 📦 Deliverables
- `[x]` Full Playwright trace + video suite.  
- `[x]` Telemetry JSON export for timing verification.  
- `[x]` Signed validation sheet (QA/PM/Dev/UX).  
- `[x]` Release tag: `v0.7.4-demo-playback-validation`.  

**Owner:** Product Management / QA / Codex Dev  
**Status:** 🚀 In Validation Phase

