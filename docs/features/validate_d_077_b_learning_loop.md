### Directive D077B_Stub – Bootstrap Specification for Learning Loop Code Paths

#### Objective
Provide Codex with the initial scaffolding for D077B so the **Intent ⇄ Sequencer Learning Loop** can execute end-to-end before adaptive intelligence logic is fully implemented.

---

### 1️⃣ Required File Paths

```
/lib/change-intelligence/intent-model.ts
/lib/sequencer/engine.ts
/lib/telemetry/index.ts
/api/sequencer/sync/route.ts
/scripts/dev/emit_test_events.js
/scripts/dev/compute_learning_metrics.js
```

---

### 2️⃣ Scaffolding Code Snippets

#### ➤ `/lib/change-intelligence/intent-model.ts`
```ts
import fs from 'fs/promises';

export const recordIntentFeedback = async (event) => {
  const file = 'data/learning/intent_feedback.ndjson';
  const payload = { ...event, timestamp: new Date().toISOString() };
  await fs.appendFile(file, JSON.stringify(payload) + "\n");
};
```

---

#### ➤ `/lib/sequencer/engine.ts`
```ts
import { emitTelemetry } from '@/lib/telemetry';
import { recordIntentFeedback } from '@/lib/change-intelligence/intent-model';

export async function runSequencerEvent(type, payload) {
  emitTelemetry(type, payload);
  await recordIntentFeedback({ type, ...payload });
}
```

---

#### ➤ `/api/sequencer/sync/route.ts`
```ts
import { NextResponse } from 'next/server';
import { recordIntentFeedback } from '@/lib/change-intelligence/intent-model';

export async function POST(req) {
  const data = await req.json();
  await recordIntentFeedback(data);
  return NextResponse.json({ ok: true });
}
```

---

#### ➤ `/lib/telemetry/index.ts`
```ts
export const emitTelemetry = (type, payload) => {
  console.log(`[TELEMETRY] ${type}`, payload);
};

export const logAdaptiveChange = (msg) => {
  console.log(`[INFO] adaptive: ${msg}`);
};
```

---

#### ➤ `/scripts/dev/emit_test_events.js`
```js
import { runSequencerEvent } from '@/lib/sequencer/engine.js';

await runSequencerEvent('sequencer_action_confirmed', { project_id: 'deckers', wave: 1 });
await runSequencerEvent('sequencer_timeline_shifted', { project_id: 'deckers', wave: 2 });
await runSequencerEvent('sequencer_dependency_blocked', { project_id: 'deckers', wave: 3 });
```

---

#### ➤ `/scripts/dev/compute_learning_metrics.js`
```js
import fs from 'fs';

const data = fs.readFileSync('data/learning/intent_feedback.ndjson', 'utf8')
  .trim()
  .split('\n')
  .map(JSON.parse);

const metrics = {
  IEΔ: Math.random().toFixed(2),
  VoC: Math.random().toFixed(2),
  AMx: Math.random().toFixed(2)
};

console.log(metrics);
```

---

### 3️⃣ Integration Checklist

| Area | Requirement | Status |
|------|--------------|--------|
| Learning Repo | `/data/learning/intent_feedback.ndjson` created automatically | ☐ |
| API | `/api/sequencer/sync` accepts POST events | ☐ |
| Telemetry | Logs telemetry and adaptive messages | ☐ |
| CLI Scripts | Emit test events and compute metrics successfully | ☐ |

---

### ✅ Acceptance Criteria
- Events persist successfully to NDJSON file.
- Telemetry console outputs appear with `[TELEMETRY]` and `[INFO] adaptive:` prefixes.
- Playbook commands execute without error.
- Stub ready for full adaptive intelligence expansion in D077C.

---

**Governance:**
> This is a temporary bootstrap directive for Codex. Once confirmed operational, this will be merged into D077C – Learning Engine Implementation. Do not modify structure or paths without approval from **Agent Z** and **Fuxi**.

