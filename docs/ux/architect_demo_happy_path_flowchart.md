## 🎯 Fuxi_EA Architect Demo Happy Path Flowchart (v0.7.1) — Timing Pass 1

### Purpose
This version introduces *visual timing and pacing cues* for Codex and the design team to align the conversational flow and UX rhythm. Each agent-user exchange now includes estimated durations and transition dependencies to preserve cognitive continuity.

---

### 🧩 1️⃣ Onboarding & Intent Setup (≈ 10s)
**Objective:** Establish enterprise scope and architect intent.

**Agent Prompt (T+0s):**
> "Welcome back. Shall we assess your current enterprise, your future architecture, or the full technology inventory?"

**User Response (T+3s–8s):** Current enterprise.

**System Action (T+8s–10s):**
- Create session (`/data/sessions/{projectId}.json`)
- Context: `{ intent: 'assessment', mode: 'architect', state: 'current' }`
- Sidebar fade-in → Chat focus animation (1s)
- Telemetry: `onboarding_loaded`

---

### 🧭 2️⃣ Platform Selection (≈ 15s)
**Objective:** Capture focus platforms for the session.

**Agent Prompt (T+10s):**
> "Which major platforms do you want to explore today — ERP, CRM, Finance, Data, or Commerce?"

**User Response (T+13s–20s):** ERP, Finance, Data.

**System Action (T+20s–23s):**
- Context save: `focusPlatforms = ['ERP','Finance','Data']`
- Sidebar badge pulse animation (2s)
- Telemetry: `conversation_context_updated`

---

### 📤 3️⃣ Upload & Discovery (≈ 20s)
**Objective:** Ingest current + future state data.

**Agent Prompt (T+23s):**
> "Would you like to upload your current state, your future state, or both?"

**User Response (T+26s–30s):** Both.

**System Action (T+30s–43s):**
- Trigger `/api/ingestion/inventory`
- File upload animation (progress bar 5–8s)
- Confirmation card fade-in (2s delay before next narration)
- Telemetry: `ingestion_completed`

---

### ⚙️ 4️⃣ Harmonization Summary (≈ 25s)
**Objective:** Display harmonized enterprise model and context.

**Agent Prompt (T+45s):**
> "I’ve harmonized 42 systems across your 3 platforms. ERP and Finance share the highest overlap. Would you like to view by platform or capability?"

**User Response (T+50s–55s):** By platform.

**System Action (T+55s–70s):**
- Call `/api/harmonization?filter=platforms`
- **Timing cue:** Wait until all graph nodes render (2s buffer after load event)
- Agent overlay appears once visual stabilization is confirmed.
- Telemetry: `harmonization_completed`

🧠 **UX Cue:** Delay narration until graph fully loaded; visual calm before speech.

---

### 🗺️ 5️⃣ Sequencing & Modernization Waves (≈ 20s)
**Objective:** Generate roadmap and transformation narrative.

**Agent Prompt (T+70s):**
> "Based on dependencies, I’ve drafted three modernization waves:\nWave 1 – Finance Core\nWave 2 – ERP Integration\nWave 3 – Data Optimization.\nWould you like to prioritize by value or by complexity?"

**User Response (T+75s–80s):** Value.

**System Action (T+80s–90s):**
- Call `/api/sequence/plan?strategy=value`
- Render 3–5 roadmap cards inline (1s staggered animation per card)
- Telemetry: `sequencing_generated`

---

### 💹 6️⃣ ROI & Value Summary (≈ 15s)
**Objective:** Connect roadmap outcomes to value.

**Agent Prompt (T+90s):**
> "Here’s your ROI summary by platform:\nERP: +8% efficiency\nFinance: +12% cost reduction\nData: +5% throughput gain."

**System Action (T+92s–105s):**
- ROI Dashboard loads (fade from chat → dashboard 1.5s)
- Chart transitions animate sequentially (2s total)
- Telemetry: `roi_summary_displayed`

🧠 **UX Cue:** Pause agent narration for 2s post-load to let charts settle visually.

---

### 📦 7️⃣ Close & Export (≈ 10s)
**Objective:** Conclude the narrative and offer export.

**Agent Prompt (T+105s):**
> "Your enterprise harmonization is complete. Would you like to export your roadmap or review transformation risks next?"

**User Response (T+108s–112s):** Export roadmap.

**System Action (T+112s–118s):**
- Export spinner (1s)
- Success toast (2s)
- Telemetry: `session_completed`
- Sidebar archive icon pulse (0.5s)

---

### ⏱️ Timing Summary Table
| Phase | Duration | Key Transitions |
|--------|-----------|----------------|
| Onboarding | 10s | Session init + sidebar fade |
| Platform Selection | 15s | Context update + badge pulse |
| Upload & Discovery | 20s | File upload animation + confirmation |
| Harmonization | 25s | Graph stabilization + overlay narration |
| Sequencing | 20s | Roadmap card reveal |
| ROI | 15s | Chart transition pacing |
| Close | 10s | Export + archive feedback |

---

### 🧠 Cognitive & UX Timing Principles
1. **No narration during movement:** The agent only speaks once visuals are static.
2. **1–2s cognitive pauses:** Insert small silences after transitions to simulate natural “thinking time.”
3. **Sequential animation rhythm:** Never stack more than 2 concurrent animations; stagger for clarity.
4. **Tone control:** Agent maintains confident, advisory tone; concise responses, 2–3 sentences max.

---

### ✅ Total Demo Duration
Approx. **2 minutes** end-to-end — ideal for a live demo or recorded walkthrough.

---

### 📌 Next Iteration Goal
- Fine-tune pacing after reviewing live video timing.  
- Align graph stabilization delay and chart transition with real render times.  
- Add optional “agent breathing” pauses (audible or visual cues) if presentation pacing feels rushed.

