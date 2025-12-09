### Directive D077C-L – Adaptive Learning Engine (Lite)

#### Objective

Implement a streamlined version of the Adaptive Learning Engine that computes real metrics and reacts dynamically to user intents, sequences, and impact data for demo purposes.

> ⚠️ This build is designed to demonstrate true adaptive behavior using live telemetry but is not the full production engine.

---

### Core Modules

| Module                         | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `/lib/learning/engine.ts`      | Orchestrates metric generation and telemetry handling.           |
| `/lib/learning/scoring.ts`     | Computes `risk`, `confidence`, `velocity`, and `maturity`.       |
| `/lib/learning/persistence.ts` | Writes adaptive data to `/data/learning/intent_feedback.ndjson`. |
| `/lib/learning/narratives.ts`  | Composes contextual EAgent responses based on computed metrics.  |

---

### Functional Flow

```
User Intent ➜ Graph Query ➜ Metric Calculation ➜ ROI/TCC Update ➜ EAgent Response ➜ Learning Repo
```

1️⃣ **Input:** Captured user intent (e.g., "replace Oracle EBS with SAP S/4HANA")\
→ Telemetry: `intent_declared`

2️⃣ **Graph Query:** Pulls connected systems, integrations, and domains from digital twin.\
→ Example: 19 systems, 217 integrations, 3 domains.

3️⃣ **Metric Calculation:**

```ts
const risk = (integrations / 250) * 0.9;
const confidence = 1 - risk;
const velocity = (completed_waves / total_waves) * 0.8;
const maturity = (confidence + velocity) / 2;
```

4️⃣ **Persistence:**

```ts
recordLearning({
  project_id,
  intent,
  risk,
  confidence,
  velocity,
  maturity,
  timestamp: new Date()
});
```

5️⃣ **EAgent Narrative Generation:**

```ts
if (risk > 0.75)
  return `High-risk foundational change detected: ${systems} systems, ${integrations} integrations affected.`;
else
  return `Moderate-impact change. Confidence holding steady at ${(confidence*100).toFixed(0)}%.`;
```

6️⃣ **ROI/TCC Synchronization:** Emits `roi_update_pending` and updates dashboard metrics accordingly.

---

### Example NDJSON Output

```json
{
  "project_id": "deckers",
  "intent": "replace Oracle EBS → SAP S/4",
  "risk": 0.83,
  "confidence": 0.67,
  "velocity": 0.58,
  "maturity": 0.62,
  "timestamp": "2025-12-08T17:22Z"
}
```

---

### Demo Integration

- Triggers from Sequencer and Intent Parsing.
- Outputs metrics to ROI/TCC dashboard.
- EAgent narrates dynamic insights based on computed values.

**Example Output:**

> “Retiring Oracle EBS means touching 200 integrations across 20 systems. That classifies as high risk. ROI confidence decreased to 0.67, but adaptive maturity remains stable.”

---

### Testing

Run local dev environment and trigger test events:

```bash
npm run dev
node scripts/dev/emit_test_events.js
```

✅ Expected console output:

```
[ALE] Risk: 0.83 Confidence: 0.67 Velocity: 0.58
```

---

### Governance

- **Branch:** `feature/d077c_l_ale-lite`
- **Commit:** `feat(learning): add adaptive learning engine (lite)`
- **Approvers:** Agent Z (Bill) & Fuxi
- **Scope:** Demo-ready adaptive intelligence system, pending future production upgrade.

---

### 🧩 Kick-Off Checklist for Codex

1️⃣ **Lock the Demo Baseline**

```bash
git checkout main
git pull origin main
git merge dev
git commit -m "chore: lock demo baseline before ALE-Lite integration"
git push origin main
git tag -a v0.7.0-demo-baseline -m "Stable pre-ALE demo baseline"
git push origin v0.7.0-demo-baseline
```

2️⃣ **Create Development Branch**

```bash
git checkout -b feature/d077c_l_ale-lite main
```

3️⃣ **Implement Learning Modules**

- `/lib/learning/engine.ts`
- `/lib/learning/scoring.ts`
- `/lib/learning/persistence.ts`
- `/lib/learning/narratives.ts`

4️⃣ **Patch Integration Points**

- Sequencer event hook (telemetry → ALE)
- EAgent response system (ALE → Narratives)
- ROI/TCC updater (ALE → metrics dashboard)

5️⃣ **Run Validation Tests**

```bash
npx tsc --noEmit
npx playwright test
tail -n 3 data/learning/intent_feedback.ndjson
```

✅ Expectation:

```
[ALE] Risk: 0.83 Confidence: 0.67 Velocity: 0.58
```

6️⃣ **Merge and Tag**

```bash
git checkout dev
git merge feature/d077c_l_ale-lite
git push origin dev
git tag -a v0.7.1-ale-lite -m "Added Adaptive Learning Engine (Lite)"
git push origin v0.7.1-ale-lite
```

---

**Notes:**

- Codex must not modify UXShell, routes, or telemetry schema.
- This is a functional build designed for the upcoming demo.
- Approval required from Agent Z & Fuxi before merging to `dev`.

---

### 🧪 Demo Verification Protocol

**Purpose:** Ensure the Adaptive Learning Engine (Lite) operates correctly during the demo and delivers real adaptive feedback to users.

**Verification Steps:** 1️⃣ Load a test project (e.g., Deckers) and open the Digital Twin view.\
2️⃣ Trigger an intent: “Replace Oracle EBS with SAP S/4.”\
3️⃣ Observe EAgent’s response — it must reflect integration count, system scope, and risk level.

**Expected UI Behavior:**

- ALE metrics appear in console (`risk`, `confidence`, `velocity`, `maturity`).
- ROI/TCC dashboard updates with new metrics (+/- deltas displayed).
- EAgent delivers a contextual statement with matching data values.

**Telemetry Verification:**

- Ensure these events appear in logs:
  - `intent_declared`
  - `learning_metrics_generated`
  - `roi_update_pending`
  - `eagent_response_emitted`

**Success Criteria:**

- EAgent and dashboards display aligned data values.
- NDJSON entries appended correctly to `/data/learning/intent_feedback.ndjson`.
- No runtime errors or failed telemetry events.
- System performance unaffected (<100ms response from ALE trigger to response render).

---

✅ Once verified, tag as `v0.7.2-ale-lite-demo-verified` and lock branch for review.

