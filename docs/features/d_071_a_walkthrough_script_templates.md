## 🎓 Directive D071-A – Agent Walkthrough Script Templates

**Version:** v0.7.4-draft  
**Purpose:** Define reusable conversational walkthrough scripts that allow the Fuxi_EA Agent to explain or demonstrate key enterprise architecture functions, such as harmonization, sequencing, and ROI calculation. These scripts power the Assistive Walkthrough Mode described in Directive D071.

---

### 1️⃣ Design Principles

| Principle | Description |
|------------|-------------|
| **Natural Conversation** | Each walkthrough feels like a short, guided dialogue — not a lecture. The Agent pauses for user input every 1–2 steps. |
| **Context Awareness** | The Agent references current session data when available; otherwise, uses sample data. |
| **Visual Synchronization** | Each explanation step maps to a visible UI state (chart, card, graph). |
| **Adaptive Depth** | The Agent adjusts the level of detail based on user tone and response (“Show me more” → extended explanation). |

---

### 2️⃣ Walkthrough: Harmonization Flow

**Trigger Intent:** `explain_feature(harmonization)`  
**Related Directive:** D068

#### Script Flow
1. **Intro (T+0s)**  
   > “Harmonization is how we identify overlaps and dependencies across your enterprise systems.”

2. **Step 1 (T+3s)**  
   > “I start by reading your uploaded data — systems, platforms, and integrations.”  
   *(UI cue: highlights Upload Summary card)*

3. **Step 2 (T+7s)**  
   > “Then I map connections between them, grouping by platform. For example, Finance and ERP often share cost management modules.”  
   *(UI cue: nodes animate into clusters)*

4. **Step 3 (T+12s)**  
   > “Finally, I highlight redundancies and opportunities for consolidation.”  
   *(UI cue: dependency lines flash or fade)*

5. **Prompt for engagement (T+15s)**  
   > “Would you like to try this on your own enterprise data?”

---

### 3️⃣ Walkthrough: Sequencing & Modernization Waves

**Trigger Intent:** `explain_feature(sequencing)`  
**Related Directive:** D040, D068

#### Script Flow
1. **Intro (T+0s)**  
   > “Sequencing determines the order of modernization initiatives based on value and dependencies.”

2. **Step 1 (T+3s)**  
   > “Each wave focuses on a set of systems that deliver measurable business outcomes.”  
   *(UI cue: display Wave 1 card)*

3. **Step 2 (T+7s)**  
   > “For instance, starting with Finance unlocks efficiency gains that make ERP migration smoother.”

4. **Step 3 (T+11s)**  
   > “You can adjust priorities — by value, complexity, or business domain — depending on your transformation strategy.”

5. **Prompt for engagement (T+14s)**  
   > “Would you like me to generate a live sequencing plan for your current platforms?”

---

### 4️⃣ Walkthrough: ROI Calculation & Forecasting

**Trigger Intent:** `explain_feature(roi)`  
**Related Directive:** D052, D052B

#### Script Flow
1. **Intro (T+0s)**  
   > “ROI forecasting connects your roadmap to financial outcomes.”

2. **Step 1 (T+3s)**  
   > “I calculate Total Cost of Change — the expected investment required across people, process, and technology.”  
   *(UI cue: show TCC card)*

3. **Step 2 (T+8s)**  
   > “Then I project benefits — efficiency gains, cost reductions, and capability growth — over 12 to 24 months.”  
   *(UI cue: chart animates)*

4. **Step 3 (T+12s)**  
   > “The result is your break-even month and net ROI percentage.”

5. **Prompt for engagement (T+15s)**  
   > “Would you like me to run these numbers on your current roadmap?”

---

### 5️⃣ Walkthrough: Enterprise Overview / Demo Mode

**Trigger Intent:** `explain_feature(demo)`  
**Purpose:** Provide a 2-minute guided tour of the Fuxi_EA application.

#### Script Flow
1. **Intro (T+0s)**  
   > “Welcome to Fuxi_EA. Let’s explore how I help architects design enterprise transformations.”

2. **Step 1 (T+4s)**  
   > “We start in the Command Deck — the central workspace where you and I collaborate.”

3. **Step 2 (T+8s)**  
   > “From here, you can upload data, harmonize systems, sequence modernization waves, and calculate ROI.”

4. **Step 3 (T+13s)**  
   > “Every step is guided by conversation — you ask questions, and I respond with insights and visual context.”

5. **Step 4 (T+18s)**  
   > “Finally, everything ties into a unified roadmap and ROI summary you can export or share.”

6. **Prompt for engagement (T+22s)**  
   > “Would you like to try it yourself or start a new enterprise project?”

---

### 6️⃣ Implementation Notes

| Component | Responsibility |
|------------|----------------|
| `scripts/walkthroughs/*.json` | Store script templates for each feature. |
| `AgentIntentHandler` | Detect and trigger walkthrough mode. |
| `ToneLayer` | Apply phrasing variants (formal / neutral / concise). |
| `TimingHooks` | Synchronize narration with UI animation events. |

Example JSON structure:
```json
{
  "id": "roi",
  "steps": [
    { "text": "ROI forecasting connects your roadmap to outcomes.", "delay": 0 },
    { "text": "I calculate Total Cost of Change across dimensions.", "delay": 3000 },
    { "text": "Then I project benefits and efficiency gains.", "delay": 8000 }
  ]
}
```

---

### ✅ Expected Outcome
- The Agent can explain or demonstrate any key function conversationally.  
- Walkthroughs follow consistent tone and pacing per D069 standards.  
- Demo experiences feel natural, adaptive, and educational.  
- Users can switch seamlessly between learning mode and live mode.

---

**Owner:** Product Management / Agent Experience / Codex Dev  
**Status:** 🚀 Active  
**Release Tag:** `v0.7.4-walkthrough-scripts`

