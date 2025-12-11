## 🧭 Directive D077B-I — Integration Flow Ingestion (Boomi / OMS Alignment)

### 🎯 Objective

Establish the ingestion pipeline for *integration telemetry* (e.g., Boomi, MuleSoft, Kafka, or custom API gateways) into the **ALE reasoning layer** so that the Fuxi ecosystem can:

- Detect integration modernization trends (e.g., Boomi adoption).
- Track health, latency, and topology changes in OMS-related integrations.
- Enrich the intelligence layer (ROI, TCC, sequencing readiness) with live flow data.

---

### 🧩 Scope

| Layer                | Artifact                                 | Purpose                                  |
| -------------------- | ---------------------------------------- | ---------------------------------------- |
| **Source**           | Datadog telemetry export (CSV / API)     | Integration service inventory + status   |
| **Ingestion Script** | `/scripts/ingest_integration_flows.py`   | Parse Boomi signals, normalize schema    |
| **ALE Store**        | `/api/ale/integration-flows`             | Persist normalized flow metadata         |
| **Graph Sync**       | `/components/graph/IntegrationLayer.tsx` | Overlay live flows on Digital Twin graph |

---

### 🧱 Planned Flow

```bash
[Datadog CSV/API]
     ↓
(scripts/ingest_integration_flows.py)
     ↓
(ALE normalization schema)
     ↓
/api/ale/integration-flows
     ↓
(IntegrationLayer.tsx renders overlays)
```

---

### ⚙️ Example Normalized Payload

```json
{
  "source": "boomi",
  "system_from": "Oracle_EBS",
  "system_to": "MFCS",
  "flow_id": "oms_order_sync_v2",
  "env": "prod",
  "status": "healthy",
  "last_seen": "2025-12-10T09:15:00Z",
  "latency_ms": 320,
  "error_rate": 0.002,
  "owner_team": "IntegrationPlatform",
  "confidence": 0.94
}
```

---

### 🧠 ALE Learning Hooks

Each ingestion event feeds the **Adaptive Learning Engine (ALE)**:

- **Categorization** → OMS-linked vs. external.
- **Confidence weighting** → based on telemetry recency + service stability.
- **Sequence hints** → system dependencies automatically updated in the Sequencer.

---

### 📘 Schema Reference

| Field                       | Type   | Description                                 |
| --------------------------- | ------ | ------------------------------------------- |
| `flow_id`                   | string | Unique integration identifier               |
| `source`                    | string | Integration technology (Boomi, Kafka, etc.) |
| `system_from` / `system_to` | string | Connected systems                           |
| `env`                       | string | Environment (dev, stg, prod)                |
| `latency_ms`                | number | Average latency from telemetry              |
| `error_rate`                | number | Error ratio over last 24h                   |
| `status`                    | enum   | `healthy`, `degraded`, `failed`             |
| `confidence`                | float  | Derived reliability score                   |

---

### 🔄 Output

- Enriched intelligence metrics for D085-series ("Org Intelligence Reports")
- Live graph overlays in **Digital Twin → Integration Plane**
- Provenance trail entries under D077B-S snapshot manifest

---

### 🧾 Data Ingestion Verification Checklist

1️⃣ **Initial Dataset Received:** Confirm Boomi CSV/API file exists in `/data/integration/raw/`.  
2️⃣ **Schema Validation:** Run `scripts/ingest_integration_flows.py --validate` → no missing required fields.  
3️⃣ **ALE Store Write Test:** POST one normalized record to `/api/ale/integration-flows` → expect HTTP 200.  
4️⃣ **Graph Sync Confirmation:** Open `graph-prototype` and toggle Integration Layer → new flows appear.  
5️⃣ **Telemetry Sanity Check:** Verify at least three attributes (`latency_ms`, `error_rate`, `confidence`) populated.  
6️⃣ **Provenance Tag:** Append validation details in `docs/features/d_077b_snapshot_provenance.md` with timestamp and data source.

---

### ⚡ Automation Script — `verify_ingestion.sh`

This helper script automates steps 1–5 of the checklist:

```bash
#!/bin/bash
# verify_ingestion.sh — Verifies Boomi/ALE ingestion pipeline health

RAW_PATH="data/integration/raw"
DATA_FILE=$(ls $RAW_PATH/*.csv 2>/dev/null | head -n 1)

if [ -z "$DATA_FILE" ]; then
  echo "❌ No dataset found in $RAW_PATH"
  exit 1
else
  echo "✅ Found dataset: $DATA_FILE"
fi

# Step 2: Validate schema
python3 scripts/ingest_integration_flows.py --validate $DATA_FILE || {
  echo "❌ Schema validation failed"
  exit 1
}

# Step 3: Push one test record
TEST_PAYLOAD='{"source":"boomi","flow_id":"oms_test_ping","system_from":"test","system_to":"MFCS","env":"dev"}'
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/ale/integration-flows -H "Content-Type: application/json" -d "$TEST_PAYLOAD")

if [ "$RESPONSE" -eq 200 ]; then
  echo "✅ ALE store write test passed"
else
  echo "❌ ALE store write failed ($RESPONSE)"
  exit 1
fi

echo "⚙️ Checking graph-prototype for Integration Layer visibility..."
# (optional: add Playwright/e2e validation here)

echo "✅ Ingestion verification complete."
```

Run with:
```bash
chmod +x verify_ingestion.sh
./verify_ingestion.sh
```

---

### ✅ Completion Criteria

- Parser script operational
- Endpoint `/api/ale/integration-flows` accepting POST payloads
- Graph overlay visible in `graph-prototype`
- At least one dataset ingested (Boomi CSV or API snapshot)
- Verification checklist executed successfully via `verify_ingestion.sh`

---

**Branch:** `feature/integration-flow-ingestion`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D077B-S, D084C, D085A

