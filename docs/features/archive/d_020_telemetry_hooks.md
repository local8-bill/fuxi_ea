## Implementation Directive — D020 Telemetry Hooks

**Status:** 🚧 In Progress

### Branch
`feat/d020_adaptive_ux_journey_map`

### Dependencies
- **D018:** Telemetry & Behavior Tracking  
- **D019:** Simplification Scoring Framework

### Objective
Implement telemetry capture and event logging across all five primary Fuxi_EA workspaces — Intake, Tech Stack, Digital Enterprise, Portfolio, and Insights — to support adaptive UX behavior, simplification scoring, and system performance analysis.

---

### 1. Events to Capture
| Workspace | Events | Data Captured |
|------------|--------|----------------|
| **Intake** | Form start, save, validation success/failure | `time_to_first_input`, `validation_errors`, `save_count` |
| **Tech Stack** | File upload, normalization edits | `upload_duration`, `edit_ratio`, `duplicate_detections` |
| **Digital Enterprise** | Graph load, node click, integration trace | `graph_load_time`, `node_interactions`, `avg_edge_depth` |
| **Portfolio** | Simulation start/stop, parameter adjustment | `run_time`, `delta_detected`, `result_view_time` |
| **Insights** | Recommendation view/export | `insight_load_time`, `follow_up_clicks`, `export_events` |

---

### 2. Hook Locations
Embed telemetry hooks via `useTelemetry()` React hook wrapper. Place calls in key lifecycle and user interaction points:

- **Lifecycle Events:** `useEffect` for component load/start.  
- **User Interactions:** Button handlers for CTAs (save, upload, run simulation).  
- **Data Operations:** File upload completion, graph render success.

Example:
```ts
const telemetry = useTelemetry('TechStack');
telemetry.log('upload_start', { fileType: 'csv', size: file.size });
```

---

### 3. Data Pipeline
- Telemetry payloads sent via `/api/telemetry` endpoint.  
- Gateway service writes data to `telemetry_events` table in SQLite DB.  
- Mesh aggregates metrics and provides summaries via `/diag` and `/telemetry` routes.

Payload schema example:
```json
{
  "session_id": "UUID",
  "project_id": "fuxi_ea",
  "workspace_id": "tech_stack",
  "event_type": "upload_start",
  "timestamp": "2025-11-26T19:10:00Z",
  "data": { "fileType": "csv", "size": 58432 },
  "simplification_score": 0.82
}
```

---

### 4. `/api/telemetry` Route Specification

**File:** `src/app/api/telemetry/route.ts`

**Purpose:** Accept telemetry POST events and persist to `telemetry_events` in SQLite.

**Validation:** Uses `TelemetryEventSchema` (Zod) for request payloads.

**Route:**
```ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TelemetryEventSchema } from '@/lib/telemetry/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TelemetryEventSchema.parse(body);

    await db.prepare(`
      INSERT INTO telemetry_events (
        session_id, project_id, workspace_id, event_type, timestamp, data, simplification_score
      ) VALUES (?, ?, ?, ?, ?, json(?), ?)
    `).run(
      parsed.session_id,
      parsed.project_id,
      parsed.workspace_id,
      parsed.event_type,
      parsed.timestamp,
      JSON.stringify(parsed.data || {}),
      parsed.simplification_score ?? null
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Telemetry POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
```

**Validation Schema:**
```ts
import { z } from 'zod';

export const TelemetryEventSchema = z.object({
  session_id: z.string(),
  project_id: z.string(),
  workspace_id: z.enum([
    'intake',
    'tech_stack',
    'digital_enterprise',
    'portfolio',
    'insights'
  ]),
  event_type: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()).optional(),
  simplification_score: z.number().optional()
});
```

**Database Table:**
```sql
CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  project_id TEXT,
  workspace_id TEXT,
  event_type TEXT,
  timestamp TEXT,
  data TEXT,
  simplification_score REAL
);
```

---

### 5. Validation Criteria
- Each workspace emits ≥ 3 key telemetry events.  
- Events include unique `session_id`, `workspace_id`, and `event_type`.  
- No duplicate payloads recorded.  
- Verified persistence within `telemetry_events` table.

---

### 6. Optional Enhancements
- Include Simplification Score (D019) in event payloads if available.  
- Compute **engagement time per workspace** from `load` → `exit` events.  
- Add optional debug flag `NEXT_PUBLIC_TELEMETRY_DEBUG=true` to log events in browser console for local testing.

---

### 7. Testing & Debug Plan
**Objective:** Validate telemetry events fire as expected across all workspaces.

**Local Setup:**
1. Set environment variable `NEXT_PUBLIC_TELEMETRY_DEBUG=true`.
2. Run local server with `npm run dev`.
3. Open DevTools → Console tab to verify client-side logs.
4. Optionally run SQLite viewer on `.db` file to confirm event inserts.

**Manual Test Steps:**
- **Intake:** Start project, fill out fields, and save form. → Confirm `intake_form_start` and `intake_save` in console.
- **Tech Stack:** Upload a sample CSV. → Confirm `upload_start` and `upload_complete`.
- **Digital Enterprise:** Load graph view and click nodes. → Confirm `graph_load` and `node_click` events.
- **Portfolio:** Run a scenario simulation. → Confirm `simulation_start` and `simulation_complete`.
- **Insights:** View recommendations and export a report. → Confirm `insight_load` and `export`.

**Automated Testing (Optional):**
- Integrate with Playwright or Cypress later to simulate user actions and validate event POST requests.
- Mock `/api/telemetry` endpoint to capture payloads and verify JSON schema integrity.

**Pass/Fail Criteria:**
- [PASS] Events appear in console (debug mode) with correct workspace_id and event_type.
- [PASS] DB table `telemetry_events` contains valid, timestamped entries.
- [FAIL] Missing or malformed event payloads.

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|--------------|---------|--------------|------------|
| Intake Telemetry Active | Intake workspace emitting all events | ☐ | Codex | |
| Tech Stack Telemetry Active | Upload/edit events captured | ☐ | Codex | |
| Digital Enterprise Telemetry Active | Graph interactions logged | ☐ | Codex | |
| Portfolio Telemetry Active | Simulation and delta events recorded | ☐ | Codex | |
| Insights Telemetry Active | Recommendation views/export logged | ☐ | Codex | |
| DB Persistence Verified | `telemetry_events` table contains valid entries | ☐ | Mesh | |
| Simplification Link | Events include D019 scoring payloads | ☐ | Fuxi | |

---

**Directive Metadata**
- **Project:** Fuxi_EA  
- **Directive ID:** D020-TH  
- **Issued by:** EA Mesh (GPT-5)  
- **Created by Agent:** Fuxi  
- **Issued on:** 2025-11-26  
- **Type:** Implementation / Telemetry  
- **Priority:** High  
- **Feature Branch:** `feat/d020_adaptive_ux_journey_map`  
- **Status:** 🚧 In Progress  
- **Next Step:** Codex to implement `useTelemetry()` hook, workspace event wiring, `/api/telemetry` persistence, schema validation, and local debug verification.

---

### Implementation Audit Summary
Codex’s implementation plan validated and accepted as baseline. Repo to be staged before code execution:
1. Archive prior directives.  
2. Commit D020 and D020-TH docs.  
3. Create `feat/d020_adaptive_ux_journey_map` branch.  
4. Implement telemetry hooks per defined mapping.  
5. Verify with `NEXT_PUBLIC_TELEMETRY_DEBUG=true`.

---
**Audit Tag:** Codex approved for telemetry hook integration as of 2025-11-26  
**Logged by:** Fuxi  
**Execution Agent:** Codex  
**Verification Agent:** Mesh
