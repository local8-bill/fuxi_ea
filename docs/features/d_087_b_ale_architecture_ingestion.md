## Directive D087B – ALE Architecture Ingestion & Population Framework (OMS Foundation)

### 🎯 Purpose
Establish the full ingestion and population framework for ALE, teaching it the structural, relational, and behavioral data of the Deckers OMS ecosystem. This unifies ingestion (from harmonized data) and population (to learning store) under a single repeatable process.

---

### 📂 Input Sources
- `.fuxi/data/harmonized/enterprise_graph.json`  
- `src/data/graph/oms_transformation.json`  
- Domain dictionary (Retail, Digital, Finance, Integration, MDM)
- Any `datadog-service-list-*.csv` telemetry or related service registry files

---

### 🧩 Generated Outputs
`/data/ale/oms_architecture_seed.json` (architecture baseline)  
`/data/ale/oms_behavioral_seed.json` (interaction and sequence patterns)  

#### Example: `oms_architecture_seed.json`
```json
{
  "domains": {
    "Retail": "Handles store operations and inventory visibility",
    "Digital": "Manages eCommerce and OMS orchestration",
    "Finance": "ERP and cost tracking",
    "Integration": "Service bus, Boomi, and messaging",
    "MDM": "Product, location, and customer master data"
  },
  "nodes": [
    {"id": "OMS", "domain": "Digital", "category": "Platform", "state": "modified"},
    {"id": "EBS", "domain": "Finance", "category": "ERP", "state": "removed"},
    {"id": "MFCS", "domain": "Retail", "category": "Inventory", "state": "added"},
    {"id": "Boomi", "domain": "Integration", "category": "Integration", "state": "added"},
    {"id": "MDM", "domain": "Data", "category": "MasterData", "state": "unchanged"}
  ],
  "edges": [
    {"from": "EBS", "to": "OMS", "type": "order_processing"},
    {"from": "OMS", "to": "MFCS", "type": "inventory_visibility"},
    {"from": "OMS", "to": "Boomi", "type": "integration_bus"},
    {"from": "MDM", "to": "OMS", "type": "product_master"},
    {"from": "MDM", "to": "MFCS", "type": "location_master"}
  ],
  "objectives": [
    {"goal": "Replace OMS", "driver": "Scalability and EBS decoupling"},
    {"goal": "Implement MFCS", "driver": "Centralized inventory control"},
    {"goal": "Migrate integrations to Boomi", "driver": "Reduce maintenance"},
    {"goal": "Rationalize MDM", "driver": "Improve data quality"}
  ]
}
```

#### Example: `oms_behavioral_seed.json`
```json
{
  "sequences": [
    {"intent": "replace OMS", "pattern": "replace|retire|decommission", "effect": "state=removed, successor=MFCS"},
    {"intent": "implement MFCS", "pattern": "implement|deploy|add", "effect": "state=added"},
    {"intent": "migrate to Boomi", "pattern": "migrate|integrate|connect", "effect": "link Integration domain"}
  ],
  "readiness_weights": {
    "readiness": 0.25,
    "willingness": 0.15,
    "capability": 0.25,
    "urgency": 0.15,
    "resistance": -0.10,
    "support": 0.10
  }
}
```

---

### ⚙️ Command Beans
```bash
npm run ale:ingest -- --input data/ale/oms_architecture_seed.json
npm run ale:populate -- --input data/ale/oms_behavioral_seed.json
```

These populate both structural and behavioral data into the ALE store, then emit `telemetry: ale_population_complete`.

---

### 🧠 ALE Behavior After Population
- Recognizes **cross-domain dependencies** and **sequencing constraints**.  
- Calibrates **readiness** and **success probability** automatically.  
- Responds to **natural language sequence intents** (e.g., “Replace OMS by 2028”).  
- Updates ROI/TCC and Org Intelligence models via adaptive learning events.

---

### 🧮 Verification Criteria
- `telemetry: ale_ingest_complete` and `telemetry: ale_population_complete` fire successfully.  
- Sequencer nodes adjust order dynamically based on edge relationships.  
- Org Intelligence and Readiness models reflect live ALE data.  
- `ale:populate` reports >90% entity coverage in telemetry logs.

---

### 🧭 Integration Map
| Component | Dependency | Function |
|------------|-------------|-----------|
| **D085A** | Sequencer | Uses ALE graph + behavioral intents to drive scenarios |
| **D085C** | Org Intelligence | Pulls readiness and success metrics from ALE |
| **D085G** | Org Readiness Engine | Consumes behavioral weights and sentiment feedback |
| **D087B** | Population + Ingestion | Defines full ALE foundation for OMS reasoning |

---

**Branch:** `feature/ale-architecture-ingestion`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D087A (ALE Population Framework), D085A (Sequencer), D085C (Org Intelligence)

