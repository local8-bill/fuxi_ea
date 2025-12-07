### Directive D075 – Anticipatory Interaction Model

**Objective**  
Transform Fuxi_EA’s conversational and visual experience into an anticipatory assistant that proactively prepares, previews, and enables the user’s next step before they ask.  This behavior builds upon the stable layout baseline defined in D066D.

---

#### 1. Purpose
Enable Fuxi_EA to act as a forward-thinking strategist rather than a reactive assistant.  The system should detect user intent, predict likely next needs, and present contextual previews or actions that gently lead the user through their journey.

---

#### 2. Core Behaviors

1. **Predictive Pathing**  
   - Infer next likely step from telemetry (`useTelemetry`, `useAgentMemory`).  
   - Preload or pre-render relevant components in the background.  
   - Display preview cards offering options like *“Model ROI now?”* or *“Show harmonization summary?”*

2. **Context-Aware Guidance**  
   - Every agent response ends with a forward reference or CTA (call to action).  
   - Avoid dead ends: always offer next-step choices or insights.  
   - Integrate with D066D’s topbar icons for orientation cues.

3. **Visual Previews**  
   - Compact, dismissible panels summarizing what lies ahead.  
   - Pop in gently below the fixed topbar.  
   - Maintain continuity and avoid full-screen takeovers.

4. **Seamless Transitions**  
   - Implement `router.pushWithContext()` to carry dialogue state between routes.  
   - Maintain narrative continuity when moving between Harmonization → Sequencer → ROI views.  
   - Topbar (from D066D) remains constant visual anchor.

5. **Tone and Timing**  
   - Confident, anticipatory, and efficient.  
   - Example: *“I’ve already modeled that scenario—want to see it?”*  
   - Limit cognitive load: only one proactive suggestion at a time.

6. **Telemetry Feedback Loop**  
   - Log anticipatory events: `anticipation_triggered`, `preview_opened`, `next_step_accepted`.  
   - Aggregate data to refine future predictions per user.

---

#### 3. Implementation Hooks
- `useTelemetry()` → capture user choices and inactivity patterns.  
- `useAgentMemory()` → short-term context tracking.  
- `AgentPreviewCard` → new component for displaying previews.  
- `router.pushWithContext()` → maintain conversational state across pages.  
- `UXShellTopbar` (D066D) → highlight or pulse icons based on agent intent.

---

#### 4. Design Principles
| Principle | Description |
|------------|-------------|
| **Anticipate, don’t react** | The agent acts before the user asks. |
| **Context continuity** | Conversations flow across views without reset. |
| **Low cognitive friction** | Suggestions are bite-sized and optional. |
| **Spatial consistency** | Fixed topbar (D066D) provides a constant reference. |

---

#### 5. Integration with Other Directives
- **Depends on:** D066D (fixed topbar).  
- **Feeds into:** D068 (Harmonization Flow), D071 (Sequencer), D062 (Onboarding).  
- **Shared elements:** Agent telemetry, context memory, and unified navigation cues.

---

#### 6. Implementation Task List
1. **Telemetry Expansion**  
   - Extend `useTelemetry()` to record anticipatory triggers and response acceptance.  
   - Add schema: `anticipation_id`, `context_route`, `time_to_action`.  

2. **Agent Memory Integration**  
   - Build `useAgentMemory()` with session-persistent memory to recall previous actions.  
   - Cache last 5 intents and next-step predictions.

3. **Preview Component Development**  
   - Create `AgentPreviewCard` with properties: `title`, `summary`, `ctaLabel`, `onAccept`.  
   - Position relative to the topbar using `position: sticky` or modal attachment below header.

4. **Routing Enhancements**  
   - Replace standard route transitions with `router.pushWithContext()`.  
   - Preserve conversation state and previews when moving between flows.

5. **Topbar Interaction Hooks (D066D)**  
   - Add highlight/pulse animation methods to `UXShellTopbar` icons.  
   - Connect agent suggestions to icon highlights for visual orientation.

6. **Behavioral Tuning & Timing**  
   - Set default anticipation delay: 2.5s idle → trigger preview.  
   - Limit maximum of 3 active anticipatory suggestions per session.

7. **Testing & Validation**  
   - Write Playwright tests to verify preview rendering, transitions, and telemetry events.  
   - Ensure continuity across routes and correct restoration after reload.

8. **Telemetry Dashboard**  
   - Add visualization for `anticipation_triggered` and user acceptance rate in ROI analytics view.

---

**Success Criteria**  
- ✅ Agent proactively offers the next logical step after each major action.  
- ✅ Previews load smoothly without disrupting current context.  
- ✅ Visual and conversational continuity maintained across all pages.  
- ✅ Logs confirm anticipatory actions and user acceptance patterns.  
- ✅ Tests confirm integrated behavior with D066D topbar and navigation highlights.

