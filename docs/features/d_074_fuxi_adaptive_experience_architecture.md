## Directive D074 – Fuxi Adaptive Experience Architecture (Application DNA Framework)

### 🎯 Objective
Define the foundational experience architecture that makes Fuxi an adaptive, role-aware, and behaviorally intelligent transformation platform. This framework establishes how user context, telemetry, and agent orchestration combine to form the “living UX” of the Fuxi environment.

---

### 🧩 1. Role-Driven Context Model

Every user session carries a lightweight **persona genome**, representing their role, mindset, and focus areas.

```json
{
  "userId": "U1234",
  "role": "Change Manager",
  "organization_maturity": 0.68,
  "confidence_bias": "cautious",
  "focus_domains": ["adoption", "training", "readiness"],
  "preferred_tone": "empathetic"
}
```

**Purpose:**
- Personalizes tone, navigation, and default views.
- Adjusts Pulse sensitivity and agent prompts.
- Provides adaptive defaults for layout and terminology.

**Location:** `/lib/context/userGenome.ts`

---

### 🧠 2. Behavioral Sensing Layer (Motivation Telemetry)

Telemetry captures user intent, friction, and motivation through subtle behavioral patterns.

| Signal | Interpretation | Adaptive Response |
|---------|----------------|-------------------|
| Long delay before upload | Hesitation / uncertainty | Agent offers example file or walkthrough. |
| Multiple ROI recalculations | Validation / skepticism | Agent reveals assumptions visually. |
| Frequent route switching | Exploration / overwhelm | Pulse simplifies and agent reduces verbosity. |
| Short, repeated inputs | Testing boundaries | Agent reinforces progress visually. |

**Key Mechanism:** infer, not judge — adapt behavior to user rhythm.

---

### ⚙️ 3. Agent as UX Conductor

The Conversational Agent becomes the orchestrator of attention and flow.

**Core behavior:**
- Observes userGenome and telemetry.
- Determines current *mode* (`Explore`, `Decide`, `Validate`, `Reflect`).
- Fires adaptive UI events through an internal event bus.

```ts
emit('ux_mode:set', 'focus');
emit('pulse:highlight', 'variance');
```

**Outcome:** the interface feels guided, not static — like a system that thinks *with* the user.

---

### 🧭 4. Experience Loop — Understand → Guide → Act → Reflect

| Phase | UX Behavior | Agent Role |
|--------|--------------|-------------|
| **Understand** | Asks seeded questions (from D073A) to define goals. | Interviewer |
| **Guide** | Explains options, metrics, and ROI context. | Coach |
| **Act** | Supports decision-making, sequencing, and modeling. | Co-pilot |
| **Reflect** | Summarizes results and recommends next actions. | Analyst |

This creates a self-reinforcing feedback loop for continuous user learning.

---

### 🌐 5. Adaptive Interface Topology

Each major component becomes role- and state-aware.

| Component | Adapts Based On | Example Behavior |
|------------|-----------------|------------------|
| **Sidebar** | Role + task | For CFOs: expand ROI views, hide Graph by default. |
| **Pulse Rail** | Confidence / readiness | Adds hints when low confidence. |
| **Command Deck** | Role preference | Architects: structured input; Change Managers: conversational tone. |
| **Insights Rail** | Cognitive load | Collapses when inactive or during data-heavy steps. |

---

### 🧩 6. System Architecture Layering

```
/lib/context/       → userGenome, session telemetry, role mapping
/lib/adaptive/      → event bus, motivation inference engine
/components/agent/  → Conversational intelligence + triggers
/components/layout/ → UXShell adaptive layouts
/components/pulse/  → Live telemetry visualization
```

**Key Concept:** agent and layout form a coupled loop — the agent doesn’t just *describe* the interface; it *drives* it.

---

### 🧠 7. Ethical Intelligence Model

Fuxi learns patterns — not people.

- No PII retention.
- All adaptation occurs locally or via anonymized telemetry.
- Users can view or reset their learning profile anytime.

```ts
<FuxiPreferences /> → [View / Reset Adaptive Settings]
```

**Transparency Principle:** every adaptive behavior must be explainable (“Fuxi adjusted recommendations based on your focus on ROI metrics”).

---

### 🧬 8. DNA Summary

| Trait | Mechanism | Outcome |
|--------|------------|----------|
| **Role-aware** | userGenome | Personalized and contextual UX |
| **Motivation-sensing** | behavioral telemetry | Feels empathic and intuitive |
| **Context-adaptive** | agent orchestration | Feels intelligent and guided |
| **Ethically learning** | anonymized local inference | Builds user trust |
| **Continuously validating** | Pulse + feedback loops | Feels alive and responsive |

---

### 🚀 9. Implementation Path

1. Implement `userGenome` context and persistence.
2. Add `lib/adaptive/eventBus.ts` for UI signal orchestration.
3. Extend agent with `mode inference` and UI trigger hooks.
4. Update major components to subscribe to adaptive events.
5. Integrate telemetry event streaming with new motivation schema.

---

### ✅ 10. Expected Impact
- Users feel instantly recognized and supported.
- Fuxi’s interface becomes adaptive rather than prescriptive.
- The agent evolves into a contextual orchestrator.
- Design and telemetry unify under one behavioral intelligence layer.

**Result:** Fuxi transitions from a guided tool into a *self-adjusting environment* that senses, adapts, and learns — making transformation design feel human, efficient, and alive.


---

### 🔧 Integration Plan — Adaptive Context Bootstrapping (for Codex)

**Goal:** Initialize and wire the adaptive intelligence layer defined in D074 so that userGenome, agent modes, and motivational telemetry are live across UXShell v0.3.

#### 1. Context Initialization
- **File:** `/lib/context/userGenome.ts`
- **Purpose:** Define the reactive store for user persona, preferences, and runtime context.
- **Implementation:**
  ```ts
  import { create } from "zustand";
  export const useUserGenome = create(set => ({
    role: null,
    maturity: null,
    tone: "neutral",
    updateGenome: data => set(state => ({ ...state, ...data }))
  }));
  ```

#### 2. Adaptive Event Bus
- **File:** `/lib/adaptive/eventBus.ts`
- **Purpose:** Central messaging layer for all adaptive behaviors.
- **Implementation:**
  ```ts
  import mitt from "mitt";
  export const adaptiveBus = mitt();
  export const emit = (event, payload) => adaptiveBus.emit(event, payload);
  export const on = (event, handler) => adaptiveBus.on(event, handler);
  ```

#### 3. Agent Hook Integration
- **File:** `/components/agent/AdaptiveAgent.tsx`
- **Purpose:** Detect user mode, interpret context, and broadcast UI state changes.
- **Hooks:**
  - `useUserGenome()`
  - `useTelemetry()`
  - `adaptiveBus.emit("ux_mode:set", mode)`
- **Behavior:**
  - Detects role and recent actions.
  - Determines current *experience phase* (Understand, Guide, Act, Reflect).
  - Broadcasts matching adaptive signals to subscribed components.

#### 4. Layout Subscription
- **File:** `/components/layout/UXShellLayout.tsx`
- **Purpose:** Subscribe to adaptive events to modify layout behavior.
- **Integration:**
  ```ts
  useEffect(() => {
    on("ux_mode:set", mode => setUxMode(mode));
    on("pulse:highlight", field => setHighlightedMetric(field));
  }, []);
  ```

#### 5. Telemetry Layer
- **File:** `/lib/telemetry/motivation.ts`
- **Purpose:** Record behavioral signals without PII.
- **Schema:**
  ```json
  {
    "event": "motivation_signal",
    "userId": "hashed",
    "signal": "roi_recalculated",
    "confidenceDelta": 0.04,
    "session": "uuid"
  }
  ```

#### 6. Settings Integration
- Add an option in `/components/preferences/FuxiPreferences.tsx`:
  - [ ] View Learning Profile
  - [ ] Reset Adaptive Context
  - [ ] Opt-Out of Behavioral Learning (resets local genome)

#### 7. Testing Plan
| Test | Expected Result |
|------|------------------|
| Agent changes tone by role | CFO → concise, Architect → technical |
| Pulse reacts to context | Highlight variance after ROI recalculation |
| Sidebar adjusts dynamically | Mode: “Guide” → expand ROI section |
| Preferences reset clears local genome | Genome file returns to defaults |
| Telemetry logs only anonymized data | ✅ No PII |

---
