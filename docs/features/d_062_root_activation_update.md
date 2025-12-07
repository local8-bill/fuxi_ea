### Directive D062 – Guided Onboarding Flow (Root Activation Update)

**Objective**  
Make the Fuxi_EA landing page conversational and functional by transforming `/` into the intelligent entry point for all user interactions. Remove static hero and feature card content and align the root route with the anticipatory conversational flow introduced in D075.

---

#### 1. Purpose
- Replace the old static hero landing layout with a conversational interface.  
- Maintain a professional and neutral tone (“Hello”) until user context is loaded.  
- Integrate the agent onboarding logic directly into the root route (`/`).  
- Ensure all subsequent routes (`/project/:id/...`) maintain continuity with the onboarding agent state.

---

#### 2. Implementation Overview
**File:** `src/app/page.tsx`

Replace the static marketing layout with the following structure:

```tsx
import { useEffect } from "react";
import { UXShellLayout } from "@/components/UXShellLayout";
import { PromptBar } from "@/components/PromptBar";
import { ConversationStream } from "@/components/ConversationStream";
import { useAgent } from "@/hooks/useAgent";
import telemetry from "@/lib/telemetry";

export default function Home() {
  const { agent, send } = useAgent("onboarding");

  useEffect(() => {
    telemetry.log("landing_conversation_started", { route: "/" });
  }, []);

  return (
    <UXShellLayout>
      <div className="flex flex-col h-full items-center justify-center text-center">
        <h1 className="text-3xl font-medium mb-6 text-neutral-800">Hello</h1>
        <PromptBar
          agent={agent}
          placeholder="Ask Fuxi where to start..."
          onSubmit={(text) => send(text)}
        />
        <ConversationStream />
      </div>
    </UXShellLayout>
  );
}
```

---

#### 3. Routing Structure
| Route | Description | Behavior |
|--------|--------------|-----------|
| `/` | **Landing page (new root)** | Conversational greeting and first prompt input. |
| `/project/:id/onboarding` | Full guided onboarding context for active project. | Continues from root conversation. |
| `/project/:id/roi-dashboard` | ROI and TCC dashboard view. | Persists conversational context. |
| `/project/:id/harmonization-review` | System duplication and cleanup. | Shows anticipatory guidance. |
| `/project/:id/sequencer` | Transformation wave planning. | Predictive sequencing based on prior input. |
| `/project/:id/digital-enterprise` | Digital twin interface. | Long-term simulation and impact analysis. |

---

#### 4. Telemetry Updates
Add new events for visibility and continuity tracking:
| Event | Description |
|--------|--------------|
| `landing_conversation_started` | Fired when root `/` loads. |
| `landing_input_submitted` | Captures the user’s first input or query. |
| `onboarding_continued` | Fired when conversation transitions to `/project/:id/onboarding`. |

---

#### 5. Design and Tone
| Element | Behavior |
|----------|-----------|
| **Greeting** | Simple “Hello” (neutral; no personalization). |
| **Prompt Input** | Prompt bar centered; immediate readiness for user interaction. |
| **Conversation Flow** | Initiates onboarding agent with D075 anticipatory logic. |
| **Layout** | Uses `UXShellLayout` for consistency; hides sidebar until project context is loaded. |

---

#### 6. QA Validation Checklist
| Test | Expected Result |
|-------|-----------------|
| **Landing Page Render** | `/` loads the conversational view with greeting “Hello.” |
| **Prompt Bar Visibility** | Prompt bar is visible and interactive on page load. |
| **Agent Response** | Submitting text triggers a valid agent response within 2s. |
| **Telemetry Capture** | `landing_conversation_started` and `landing_input_submitted` events appear in `.fuxi/data/telemetry_events.ndjson`. |
| **Navigation Continuity** | After onboarding continues, conversation state persists across `/project/:id/...` routes. |
| **Sidebar State** | Sidebar remains hidden until a project context exists. |
| **Reload Behavior** | Refreshing `/` restores greeting without breaking telemetry sequence. |

---

#### 7. Success Criteria
- ✅ The app launches to the conversational greeting (`/`).  
- ✅ The onboarding agent begins accepting user input immediately.  
- ✅ Old hero layout and static feature cards are fully removed.  
- ✅ All telemetry events (`landing_conversation_started`, `landing_input_submitted`, `onboarding_continued`) are firing.  
- ✅ Navigation and conversation states persist seamlessly across subsequent routes.  
- ✅ QA validation checklist passes on all major environments.

---

**Directive Priority:** HIGH (Demo Readiness)

**Dependencies:** D075 (Anticipatory Interaction), D066D (Topbar), D060A (Sidebar)

**Target Build Tag:** `UXShell v0.4 – Conversational Root Activation`

