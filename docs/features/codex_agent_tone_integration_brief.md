## 🧩 Implementation Brief – Adaptive Voice Integration (Codex)

### Purpose
Provide Codex with a concise, technical guide to implement the **adaptive tone and dialogue standards** described in Directive D069 and Addendum D069‑A. This integration aligns the Fuxi_EA Agent’s conversational logic with the user’s phrasing style, pacing, and enterprise tone expectations.

---

### 1️⃣ Overview
The Conversational Agent already handles intent classification and API routing (per D066). This brief adds a **Tone Layer** between *intent resolution* and *response rendering*. The Tone Layer adjusts phrasing, verbosity, and rhythm based on the user’s language style observed in prior messages.

**Goal:** The Agent subtly mirrors the user’s vocabulary, maintains professional tone, and synchronizes speech with UX timing rules.

---

### 2️⃣ Architecture Integration
**Location:** `components/ConversationalAgent.tsx`

```
Intent → Tone Layer → Template Engine → Renderer
```

| Layer | Function | Output |
|--------|-----------|--------|
| **Intent** | Identifies user request (upload, harmonization, sequencing, ROI) | `intentObject` |
| **Tone Layer (new)** | Determines phrasing and formality | `toneProfile` |
| **Template Engine** | Selects appropriate response template | `responseTemplate` |
| **Renderer** | Outputs text + timing cues to chat interface | `chatMessage` |

---

### 3️⃣ Tone Layer Specification
**File:** `/lib/agent/toneProfile.ts`

#### Functions
```ts
function analyzeUserTone(userInput: string, session: Session): ToneProfile
```
**Input:** user message string, session object  
**Output:** `{ formality: 'formal'|'neutral'|'concise', verbosity: 'low'|'medium'|'high', keywords: string[] }`

#### Heuristics
| Behavior | Detection | Result |
|-----------|------------|--------|
| Short replies (≤4 words) | “ok”, “sure”, “go ahead” | `concise` |
| Formal punctuation / full sentences | Capitalized start + period | `formal` |
| Technical nouns (ERP, ROI, TCC) | Regex keyword detection | `neutral` or `formal` |

#### Storage
ToneProfile stored in `session.tone_profile`. Update after each message using moving average weighting:
```ts
session.tone_profile = blendProfiles(previousProfile, newProfile, weight = 0.7);
```

---

### 4️⃣ Template Engine Enhancements
**File:** `/lib/agent/templates.ts`

Templates organized by tone and intent:
```ts
export const templates = {
  harmonization: {
    neutral: "Here’s your enterprise map. ${summary}",
    formal: "Harmonization completed. ${summary} Would you like to continue by platform or capability?",
    concise: "${summary} — explore by platform or capability?",
  },
  sequencing: {
    neutral: "I’ve drafted three modernization waves. ${options}",
    formal: "Based on dependencies, three modernization waves are recommended. ${options}",
    concise: "Three waves ready. ${options}",
  },
};
```

Response generation:
```ts
const profile = session.tone_profile || 'neutral';
const template = templates[intent.id][profile];
return fillTemplate(template, contextData);
```

---

### 5️⃣ Timing Synchronization Hooks
**File:** `/lib/agent/timingHooks.ts`

Use hooks to pause narration until visuals are stable.
```ts
await waitForVisualCalm('graphRender'); // +2s buffer
await speakWithDelay(message, 1500); // humanized cadence
```

Standard delays per context:
| Event | Delay | Source |
|--------|-------|--------|
| Graph Load | 2000 ms | D069 Timing Table |
| Chart Transition | 1500 ms | D069 Timing Table |
| Upload Confirmation | 1000 ms | D069 Timing Table |

---

### 6️⃣ Testing Plan
**Playwright Tests:**
| Test | Objective |
|------|------------|
| `tone_profile_update.spec.ts` | Verify tone profile updates after 3+ user inputs. |
| `template_selection.spec.ts` | Ensure correct phrasing template selected per tone. |
| `timing_hooks_alignment.spec.ts` | Confirm narration only begins post‑visual calm. |
| `mirroring_accuracy.spec.ts` | Detect that Agent reuses user’s key terms. |

**Telemetry Fields:**
- `tone_profile_change` → `{ old: 'neutral', new: 'concise' }`
- `template_used` → `{ intent: 'harmonization', tone: 'formal' }`
- `speech_delay_applied` → `{ ms: 1500 }`

---

### 7️⃣ Expected Output
The Agent:
- Mirrors user vocabulary (nouns, platforms, verbs) naturally.
- Adjusts phrasing and verbosity to match user tone.
- Synchronizes dialogue with UI transitions.
- Passes all conversational timing and tone validation tests.

---

### 📦 Deliverables
- `[x]` `toneProfile.ts` implementation.  
- `[x]` Template engine tone variants.  
- `[x]` Timing synchronization hooks.  
- `[x]` New Playwright and telemetry tests.  
- `[x]` Release tag: `v0.7.3-codex-tone-adaptive-integration`.

