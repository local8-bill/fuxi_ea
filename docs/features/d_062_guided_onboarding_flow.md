# D062: Guided Project Onboarding Flow

## Conversational Onboarding Mock Layout (UI Draft)

```plaintext
+--------------------------------------------------------------------------------------+
| [Logo] Fuxi_EA                                                               ⚙️ Help |
|--------------------------------------------------------------------------------------|
| 💬  Fuxi_EA Assistant                                                         [🔔]     |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   🟢 Assistant: Welcome back, ready to explore your enterprise?                      |
|                                                                                      |
|   [ Create Project ]  [ Continue Existing Project ▼ ]                               |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   🟢 Assistant: Great! Let’s start by creating your project.                         |
|   Enter your project name:  [_______________________]                               |
|                                                                                      |
|   What’s your role?  (Architect / Analyst / CIO / FP&A)                             |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   🟢 Assistant: Awesome. What’s your goal and pace?                                  |
|   Goal: [ Modernize ▼ ]   Pace: [ Moderate ▼ ]                                      |
|                                                                                      |
|   🟢 Assistant: Where would you like to start?                                       |
|   ☐ Define My Tech Stack                                                            |
|   ☐ Assess ROI                                                                      |
|   ☐ Analyze Harmonization                                                           |
|   ☐ Build My Roadmap                                                                |
|   ☐ Visualize Digital Twin                                                          |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   🟢 Assistant: Do you have existing artifacts to use or analyze?                    |
|   [ Upload Files ] or [ Skip & Build Manually ]                                     |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   📂 Uploaded: current_state.csv, future_state.csv                                  |
|   🟢 Assistant: We’ve identified 2 artifacts. Please verify their types:             |
|   [ Inventory ] [ Current State ] [ Future State ]                                  |
|                                                                                      |
|   🟢 Assistant: Excellent — harmonizing your data... 🔄                              |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   ✅ Assistant: Here’s what we found!                                               |
|   → Systems: 27 | Integrations: 54 | Domains: 6                                    |
|                                                                                      |
|   What would you like to do next?                                                   |
|   ☐ Identify mismatches / naming issues                                             |
|   ☐ Compare current vs. future state                                                |
|   ☐ Estimate cost & ROI                                                            |
|   ☐ Sequence transformation                                                        |
|                                                                                      |
|--------------------------------------------------------------------------------------|
|                                                                                      |
|   🟢 Assistant: Great — launching ROI Dashboard... 💹                                |
|                                                                                      |
|   [ View ROI Dashboard ]  [ Go to Harmonization Review ]                            |
|                                                                                      |
+--------------------------------------------------------------------------------------+
```

---

### **Implementation Notes**
- This conversational interface mimics a chat assistant but with structured input and visual clarity.
- Chat elements persist as collapsible sidebar in UX Shell.
- File upload and artifact detection re-use existing `/api/ingestion` logic.
- Each section triggers telemetry events for onboarding analytics.
- Styled with Tailwind + Framer Motion transitions for soft flow between prompts.