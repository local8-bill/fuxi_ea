## ⚙️ Directive D077B-OMS-Pilot — Intent ⇄ Sequencer Loop (OMS Scope)

### 🎯 Objective

Activate a **limited-scope cognitive feedback loop** that connects *user intent* events to *sequencer mutations* within the **OMS Transformation Graph**.  This pilot demonstrates how Fuxi can interpret user directives and automatically adjust sequencing, dependencies, and visual states in real time — without invoking the full ALE or identity stack.

---

### 🧭 Scope

**In Scope:**
- OMS transformation dataset only (Canada rollout, MFCS-first vs. Direct OMS).
- Single-user (Agent Z) local environment.
- One-way event flow: Intent → Sequencer → Graph Update.

**Out of Scope:**
- Identity manifest (D076).
- ALE telemetry & learning persistence (D084D).
- Cross-user collaboration or multi-session intent capture.

---

### 🧩 Architecture Overview

```
┌──────────────────────────────────────────────┐
│                 Agent Z Input               │
│  ("Start with Canada and drop EBS")         │
└──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│              Intent Parser API               │
│ /api/intent/parse → emits IntentEventOMS     │
└──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│           Sequencer Bridge Layer             │
│ Translates IntentEventOMS → SequenceMutation │
└──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│               Graph Engine                   │
│ Updates visual nodes, timelines, dependencies│
└──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│            Feedback & Logging                │
│ “✅ Updated: Canada → Phase 1 (B2B+B2C)”     │
└──────────────────────────────────────────────┘
```

---

### 🧠 Data Contracts

**IntentEventOMS (subset of global IntentEvent)**
```ts
{
  type: 'intent:oms-sequence',
  payload: {
    region: 'Canada',
    phase: 'Phase 1',
    channels: ['B2B', 'B2C'],
    action: 'decouple',
    target: 'EBS'
  }
}
```

**SequencerMutation**
```ts
{
  mutationType: 'updatePhase',
  targetRegion: 'Canada',
  updates: {
    systems: ['OMS', 'MFCS'],
    dependencies: ['remove:EBS'],
    timeline: 'FY26'
  }
}
```

---

### 🧱 Implementation Plan

| Step | Action | Owner | Notes |
|------|---------|--------|--------|
| 1️⃣ | Create new directive doc (this file) | Agent Z | — |
| 2️⃣ | Implement `IntentEventOMS` type in `/lib/sequencer/types.ts` | dx | Copy schema above |
| 3️⃣ | Extend `useSequencer()` to listen for `/api/intent/parse` → emit `IntentEventOMS` | dx | Filter by payload.type |
| 4️⃣ | Add handler `applyIntentToSequence()` in `/lib/sequencer/mutations.ts` | dx | Map payload to sequencer update |
| 5️⃣ | Update GraphPrototype to log confirmation messages | dx | “Scenario updated via intent” |
| 6️⃣ | Validate with live OMS graph dataset (Canada rollout test) | Agent Z | Ensure visible change on graph |

---

### 🧩 Example Interaction

> **Z:** /intent start Canada with B2B+B2C, decouple EBS

**System:**
```
✅ Intent captured: region=Canada, phase=1, channels=B2B+B2C, action=decouple:EBS
⚙️ Sequencer updated: Canada → Phase 1 rollout (OMS/MFCS active)
🧩 Graph synced: OMS node re-linked to MFCS; EBS dependency removed.
```

---

### 🚀 Deliverables

- `/lib/sequencer/intentBridge.ts` – parses and maps intent events.
- `/hooks/useSequencer()` – listens for updates and re-renders graph.
- `console + UI confirmation` – visible signal of intelligent response.
- Validation log in `/tmp/intent_oms_pilot.log`.

---

### ✅ Completion Criteria
- System can accept a typed `/intent` command describing OMS phase change.
- Sequencer timeline updates correctly in memory and UI.
- Graph visually reflects the change.
- Log output confirms transformation.

---

**Branch:** `feature/d077b_oms_pilot`

**Approvers:** Agent Z (Bill), dx

**Purpose:** Enable interactive reasoning within OMS transformation — a safe first step toward the full ALE feedback loop.

