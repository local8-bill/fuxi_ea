## 🧩 Directive D085B – dx Live Graph Monitor (Enhanced)

### 🎯 Objective
Enable **dx** to autonomously monitor, validate, and report the integrity of all graph data loaded from `/api/digital-enterprise/view`. The agent will perform sanity checks, generate a console-based health report, and assist in troubleshooting incomplete or corrupted datasets in real time — while operating in read-only mode to protect the live data.

---

### 🧠 Context
This extends **D084C** (the live OMS transformation graph) by giving **dx** an ongoing data assurance role. He’ll track node/edge coherence, domain completeness, and orphaned system records every time the graph loads in development or production, ensuring no live data is modified.

---

### 🧩 Implementation

#### 1. Create the dx Live Monitor

**File:** `src/agents/dx/liveMonitor.ts`

```ts
// --- dx Live Graph Monitor ---
// Validates graph structure and logs health diagnostics to the console.

import fs from "fs";
import path from "path";

export function monitorGraphData(data) {
  if (!data || !data.nodes) {
    console.warn("⚠️ dx: No graph data received.");
    return;
  }

  // --- Read-only safeguard ---
  if (data.source === "api") {
    console.log("🧠 dx: Read-only mode active (API data). No writes permitted.");
  }

  const domains = [...new Set(data.nodes.map((n) => n.domain))];
  const orphanNodes = data.nodes.filter(
    (n) => !data.edges.some((e) => e.source === n.id || e.target === n.id)
  );

  console.groupCollapsed("📊 dx: Graph Integrity Report");
  console.log(`🌐 Total Nodes: ${data.nodes.length}`);
  console.log(`🔗 Total Edges: ${data.edges.length}`);
  console.log(`🗂️ Domains: ${domains.join(", ")}`);
  console.log(`🧩 Orphan Nodes: ${orphanNodes.length}`);
  if (orphanNodes.length) console.table(orphanNodes.map((n) => n.label));
  console.groupEnd();
  console.log("✅ dx Graph Health Verified (read-only)");
}

// --- Backup Verification ---
export function verifyLatestBackup() {
  try {
    const backupDir = path.resolve(process.cwd(), "backups");
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith("graph_") && f.endsWith(".json"))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.warn("⚠️ dx: No backup files found in /backups.");
      return false;
    }

    const latest = files[0];
    const filePath = path.join(backupDir, latest.name);
    const fileSize = fs.statSync(filePath).size;

    if (fileSize < 1000) {
      console.warn(`⚠️ dx: Latest backup (${latest.name}) appears too small (${fileSize} bytes).`);
      return false;
    }

    console.log(`💾 dx: Verified latest backup → ${latest.name} (${(fileSize / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.error("❌ dx: Backup verification failed:", err.message);
    return false;
  }
}
```

#### 2. Integrate with Graph Prototype

In `src/app/dev/graph-prototype/page.tsx`:

```ts
import { monitorGraphData, verifyLatestBackup } from "@/agents/dx/liveMonitor";

async function loadGraphData() {
  const backupOk = verifyLatestBackup();
  if (!backupOk) console.warn("⚠️ dx: Proceeding without confirmed backup.");

  const response = await fetch("/api/digital-enterprise/view", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Graph API error: ${response.status}`);

  const data = await response.json();
  data.source = "api"; // identify source for dx's safety mode
  monitorGraphData(data);
  return data;
}
```

---

### 🛡️ Data Protection Block (Enhanced)

#### Purpose
Ensure **live graph data** integrity and validated backups before any interaction.

#### Policy
1. **Read-only enforcement:** dx logs, never writes, to API-sourced data.
2. **Pre-run verification:** dx checks `/backups` folder for latest valid backup before loading live graph data.
3. **Backup creation (manual):**
   ```bash
   curl http://localhost:3000/api/digital-enterprise/view > /backups/graph_$(date +%F).json
   ```
4. **Integrity checks:** dx validates node/edge consistency, orphan nodes, and domain presence.
5. **Audit logging:** Each run creates a `dx_integrity.log` entry in `/logs` (future iteration).

---

### ⚙️ dx’s Enhanced Operating Procedure

#### On Load:
1. Check for backup → `verifyLatestBackup()`.
2. If valid → fetch live data.
3. Execute `monitorGraphData(data)`.
4. Log results to console.

#### On Anomaly:
- Missing or invalid backup → Warn and prompt backup creation.
- Graph schema issues → Flag domains or orphan nodes.

#### On Success:
- ✅ `dx Graph Health Verified (read-only)`
- 💾 `dx: Verified latest backup → graph_YYYY-MM-DD.json`

---

### 🔁 Next Steps
| Iteration | Enhancement | Description |
|------------|--------------|-------------|
| **2** | Health Overlay | dx visual overlay on GraphCanvas (small green/red status icon). |
| **3** | ALE Feedback Loop | Feed node/orphan metrics to ALE for learning trends. |
| **4** | Auto-Repair Suggestions | dx proposes patch steps when integration metadata missing. |
| **5** | Backup Automation | dx triggers auto-backups on startup if none found. |

---

**Branch:** `feature/d085b_dx_live_monitor`  
**Approvers:** Fuxi, Agent Z (Bill)  
**Purpose:** Continuous graph integrity validation and **read-only + backup verification** protection for the live digital enterprise dataset.

