## 🧭 Directive D077B-II — Datadog Integration Flow Seeding

### 🎯 Objective
Enable automated ingestion and rollback of Datadog-derived integration data into the ALE reasoning layer, expanding real-time intelligence for OMS and enterprise sequencing models.

---

### ⚙️ Script Reference
**File:** `scripts/ingest_datadog_seed.py`

**Functions:**
- `ingest_data(<datadog-service-list.csv>)` → Parses and normalizes Datadog telemetry into ALE-compatible JSON schema.
- `rollback_seed()` → Removes Datadog-seeded flows from the ALE store.

---

### 🧩 CLI Command Beans
| Command | Description |
|----------|--------------|
| `npm run ingest:datadog <file>` | Normalize CSV + seed Datadog integration flows via `/api/ale/integration-flows`. |
| `npm run ingest:datadog:rollback` | Delete Datadog-seeded flows from the ALE store. |

**package.json Additions:**
```json
{
  "scripts": {
    "ingest:datadog": "python3 scripts/ingest_datadog_seed.py ./data/integration/raw/datadog-service-list.csv",
    "ingest:datadog:rollback": "python3 scripts/ingest_datadog_seed.py --rollback"
  }
}
```

---

### 🧱 Integration Flow
```bash
[Datadog CSV/API]
     ↓
(scripts/ingest_datadog_seed.py)
     ↓
(ALE normalization schema)
     ↓
/api/ale/integration-flows
     ↓
(IntegrationLayer.tsx overlays on Digital Twin)
```

### ✅ Verification Steps
1. `npm run ingest:datadog ./data/integration/raw/datadog-service-list.csv`
   - Creates `data/integration/seed/datadog_integration_snapshot.json`
   - Seeds `/api/ale/integration-flows` (source=datadog)
2. Open `/dev/graph-prototype`
   - Integration Telemetry panel lists the new flows (latency, status, owner)
   - Systems display “source: datadog” overlays when selected
3. `npm run ingest:datadog:rollback`
   - Removes the seeded flows; refresh to confirm panel returns to the empty state

> The Python script automatically falls back to the built-in `urllib` module when the optional `requests` package is not installed, so no additional pip setup is required.

---

### 🧠 ALE Learning Hooks
- **Source Attribution:** Tag `source=datadog` for provenance tracking.
- **Integration Health:** Include latency, error rate, and confidence in the live graph.
- **System Coupling:** Automatically correlate OMS and adjacent systems via telemetry dependencies.
- **Rollback Event:** Captured in ALE’s provenance table for traceability.

---

### ✅ Completion Criteria
- Script `ingest_datadog_seed.py` operational with ingest + rollback options.
- CLI commands aliased in `package.json`.
- Verified data visible on `/dev/graph-prototype` Integration Layer.
- ALE provenance logs show both ingest and rollback transactions.

---

**Branch:** `feature/d077b_ingestion_directive`

**Approvers:** Agent Z (Bill), dx

**Dependencies:** D077B-I (Integration Flow Ingestion), D085A (Dynamic Sequencing)
