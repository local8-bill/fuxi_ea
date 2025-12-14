### Directive D086B – Shadcn/UI Integration (Deferred)

**Status:** 🔸 *Deferred pending UX flow stabilization.*

**Purpose:**  
Introduce standardized Shadcn/UI components across the Digital Graph Suite once scene flow (Digital Twin → Sequencer → ROI) is finalized.

---

**Current Scope:**  
- ❌ No full migration at this time.  
- ✅ Limited **component trials allowed** in the **Digital Twin → Sequence** transition path:  
  - Try `Button`, `Card`, `Tabs`, `Sheet`, or `Dialog` components to validate visual fit, spacing, and interactions.  
  - Maintain existing functional hooks and data bindings.  
  - All tests must be styling or layout only — **no logic, state, or API changes.**

---

**Rationale:**  
Deferring the full Shadcn migration allows stable flow definition between scenes before committing to structural refactors. This prevents wasted design effort as navigation, scene routing, and graph interactions continue to evolve.

---

**Next Activation Trigger:**  
Once D086A (Layout Simplification) and scene routing (Digital Twin → Sequencer) reach stable acceptance criteria.

**Expected Deliverables upon activation:**  
- Unified visual style across all Digital Graph and Sequence tools.  
- Consistent padding, typography, and interaction patterns.  
- Rails and modals migrated to Shadcn `Sheet` and `Dialog` primitives.

**Branch Placeholder:** `feature/ux-shadcn-refresh`

**Approvers:** Bill (Agent Z), dx

