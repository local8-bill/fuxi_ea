## 🧭 Directive D077B-F — Adaptive Feedback Intent Bridge (Demo Mode)

### 🎯 Objective

Enable a **live, conversational feedback loop** in demo environments where a presenter can capture an audience’s “what-if” question and immediately visualize the resulting scenario on the **Digital Enterprise Graph** — without backend persistence or reasoning validation.

This directive creates a temporary bridge between `/feedback` commands and the **Sequencer**, giving the illusion of adaptive learning and real-time reasoning while maintaining full control and reversibility.

---

### 🧩 Scope

| Layer | Artifact | Purpose |
|--------|-----------|----------|
| **Command Layer** | `/feedback` command endpoint | Capture free-form feedback text (e.g., “what if OMS first?”) |
| **Parser** | `parseOpposite.ts` | Extract verbs, nouns, and directionality from text (“later → earlier”) |
| **Mutation Engine** | `applyFeedbackScenario.ts` | Apply short-lived mutations to Sequencer state |
| **Reset Handler** | `/reset` command | Restore baseline scenario and clear transient overlays |
| **UI Feedback** | `toast` + `banner` | Inform user: “Exploring alternative sequencing…” |

---

### ⚙️ Example Interaction

**Audience:**  
> What if we did OMS first and MFCS later?

**Presenter:**  
```bash
/feedback "OMS first, MFCS later"
```

**System response:**  
```bash
🧩 Exploring alternative sequencing: OMS-first scenario
```

**Graph updates:**
- OMS node shifts to **Phase 1**
- MFCS node shifts to **Phase 2**
- Banner appears: *“Alternative: OMS-first sequencing”*

**Presenter reset:**
```bash
/reset
```
*(Graph returns to canonical model)*

---

### 🧱 Internal Flow Diagram

```bash
[User Command]
   ↓
/feedback → parseOpposite(text)
   ↓
applyFeedbackScenario(tempMutation)
   ↓
Sequencer renders new state
   ↓
Banner: “Simulation Mode Active”
```

---

### 🧠 Provenance & Simulation Notes

- **All mutations** are stored locally under `/data/sim_feedback_buffer.json` for replay.
- **No writes** occur to `/api/ale` or persistent stores.
- Simulation state labeled as `demo_mode: true` and purged on reload or `/reset`.
- Provenance log entry added to `docs/feedback/demo_feedback_log.md`.

---

### 🧩 Code Hooks

```ts
if (command.type === 'feedback' && mode === 'demo') {
  const pattern = parseOpposite(command.text)
  applyFeedbackScenario(pattern)
  toast.success(`Alternative sequencing applied: ${pattern.label}`)
}
```

**Pattern examples:**
- “OMS first” → move OMS to Phase 1
- “Delay MFCS” → push MFCS one phase forward
- “Prioritize Canada” → flag Canada region as active sequence target

---

### 🧾 Completion Criteria

- `/feedback` and `/reset` commands active in demo mode
- `applyFeedbackScenario` modifies Sequencer temporarily
- Graph visibly reflects feedback intent
- Provenance entries logged to demo buffer
- Clear visual cue (banner + pulse animation)

---

### 🔮 Future Migration (Ministral Integration)

When integrated with **Ministral 3 Reasoning Engine**, this mechanism evolves into:

| Demo Mode | Ministral Mode |
|------------|----------------|
| Direct JS mutation | Verified scenario simulation |
| Instant graph update | Reasoned proposal returned via API |
| No backend persistence | Logged, validated learning event |

> In Ministral Mode, feedback becomes an input to the **Adaptive Learning Engine**, generating validated “alternate futures” instead of direct, transient rewires.

---

### 🧰 dx Setup Checklist

**Files to touch:**
- `src/app/api/commands/feedback.ts` → handle `/feedback` and `/reset`
- `src/utils/parseOpposite.ts` → lightweight intent parser for demo mode
- `src/hooks/useSequencer.ts` → expose `applyFeedbackScenario()` helper
- `src/components/graph/Banner.tsx` → add temporary banner state
- `src/data/sim_feedback_buffer.json` → temporary mutation store

**Test steps:**
1. Run the local environment: `npm run dev`
2. Type `/feedback "OMS first, MFCS later"` in the console
3. Observe graph mutation and banner display
4. Type `/reset` to restore canonical graph
5. Verify `sim_feedback_buffer.json` was updated and cleared on reset

**Rollback:**
```bash
git checkout -- src/app/api/commands/feedback.ts src/hooks/useSequencer.ts src/data/sim_feedback_buffer.json
```

---

**Branch:** `feature/feedback-intent-bridge`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D077B-S, D085A

