### Directive D075A – Anticipatory Experience Activation & UX Compliance Chain

**Objective**  
Deliver a cohesive, intelligent, and demo-ready user experience by activating the full anticipatory interaction model (D075) and enforcing sidebar hierarchy compliance (D060A). This directive ensures the Fuxi_EA demo exhibits seamless agent behavior, stable UX structure, and data-backed intelligence prior to cosmetic adjustments.

---

#### 1. Purpose
- Make the anticipatory agent (D075) operational end-to-end.  
- Guarantee the UXShell’s frame (sidebar + topbar) passes compliance tests (D060A + D066D).  
- Defer any non-critical visual refinements until post-demo stabilization.

---

#### 2. Execution Order
1. **Implement D075 – Anticipatory Interaction Model**  
   - Enable predictive pathing, context-aware guidance, and preview cards.  
   - Connect telemetry events (`anticipation_triggered`, `next_step_accepted`) to ROI/TCC/Harmonization flows.

2. **Run and Validate D060A Test Suite**  
   - Execute `tests/e2e/uxshell/sidebar_structure.spec.ts`.  
   - Confirm hierarchy, persistence, and telemetry compliance.  
   - Block further merges if any sidebar regression occurs.

3. **Integrate with D066D Topbar**  
   - Ensure anticipatory cues and highlights appear correctly in the fixed topbar.  
   - Confirm all navigation state remains persistent across routes.

4. **Demo Flow Validation (QA)**  
   - Validate conversational path: Upload → Harmonization → Sequencer → ROI.  
   - Confirm agent anticipation (preview prompts and proactive steps).  
   - Confirm sidebar and topbar remain fixed and functional.

---

#### 3. Deliverables
| Deliverable | Description | Validation Method |
|--------------|--------------|-------------------|
| **Anticipatory Flow** | Agent proactively suggests next logical steps | Manual walkthrough + telemetry events |
| **Sidebar Compliance** | Hierarchical, collapsible per D060A | Playwright test: `@directive D060A` |
| **Topbar Integration** | Stable, fixed header referencing D066D | Visual verification |
| **Telemetry Integrity** | Anticipatory + navigation telemetry firing | Review `.fuxi/data/telemetry_events.ndjson` |
| **Demo Script Readiness** | Smooth, intuitive flow through full sequence | Internal QA dry run |

---

#### 4. QA & Testing Chain
- **Primary Test:** `tests/e2e/uxshell/sidebar_structure.spec.ts` (D060A compliance).  
- **Supplemental Tests:** `tests/e2e/anticipatory_flow.spec.ts` (D075 interactions).  
- **Telemetry Validation:** Confirm logged events in `.fuxi/data/telemetry_events.ndjson`.  
- **Manual Review:** Verify conversational agent tone and transitions.

---

#### 5. Success Criteria
- ✅ Anticipatory interactions functional across all major flows.  
- ✅ Sidebar and topbar structures validated against D060A/D066D.  
- ✅ All telemetry events firing consistently.  
- ✅ Demo path exhibits intelligence, fluidity, and architectural stability.  
- ✅ Visual polish may remain in-progress; experience must feel intelligent and seamless.

---

**Directive Priority:** HIGH (Demo-Readiness)

**Dependencies:** D060A, D066D, D075

**Blocked By:** None

**Target Build Tag:** `UXShell v0.4 – Anticipatory Activation`

