## Sprint: Data Graph Foundation (DB + Neo4j Integration)

### Goal
Establish the persistent data foundation that captures and analyzes user decision behavior across projects, integrating PostgreSQL (structured telemetry) and Neo4j (graph relationships). Ensure seamless ingestion from JSON telemetry to relational + graph layers.

---

### 🧭 Objectives
1. **Implement unified data persistence:**
   - Migrate from JSON append-only logs to PostgreSQL and Neo4j.
   - Mirror all user/team/decision telemetry.
2. **Enable graph analytics:**
   - Track collaboration, influence, and decision chains.
3. **Lay groundwork for Conversational Agent & ROI explanations:**
   - Provide a persistent context base for adaptive learning.

---

### 📅 Sprint Scope (2 weeks)

#### Week 1 — Setup & Ingestion
- ✅ Create DB schema (`001_init_postgres.sql`).
- ✅ Seed Neo4j (`001_seed_neo4j.cypher`).
- 🔄 Implement `/scripts/db/ingest_json_to_db.ts`.
- 🔄 Test local ingestion from `/data/sessions/*` to both DBs.
- 🔄 Verify referential integrity and event consistency.

#### Week 2 — API & Telemetry Integration
- 🔄 Build `/api/telemetry/team` (Postgres read/write).
- 🔄 Build `/api/telemetry/team/graph` (Neo4j queries: influence, participation, collaboration).
- 🔄 Add `/api/telemetry/team/timeline` for decision playback.
- 🔄 Connect to Conversational Agent for contextual responses.

---

### ⚙️ Deliverables
| Deliverable | Description | Owner |
|--------------|--------------|--------|
| 001_init_postgres.sql | Schema migration file | Codex |
| 001_seed_neo4j.cypher | Seed data for graph testing | Codex |
| ingest_json_to_db.ts | Ingestion script for JSON → DB | Codex |
| /api/telemetry/team | REST endpoint (Postgres ops) | Fuxi |
| /api/telemetry/team/graph | REST endpoint (Neo4j ops) | Fuxi |
| /api/telemetry/team/timeline | Event time sequencing | Fuxi |
| Telemetry Dashboard | Display of metrics + team insights | Fuxi |

---

### 🔐 Dependencies
- Node packages: `pg`, `neo4j-driver`.
- Environment vars:
  ```bash
  DATABASE_URL=postgresql://user:pass@localhost:5432/fuxi
  NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
  NEO4J_USERNAME=neo4j
  NEO4J_PASSWORD=xxxx
  ```
- Existing JSON telemetry logs under `/data/sessions/`.

---

### 🧩 Optional Enhancements (Backlog)
- Auto-sync new JSON sessions via background worker.
- Role-based influence metrics (CFO vs Architect vs Analyst).
- Neo4j graph visualization layer under `Team Dynamics View`.
- Daily cron-based aggregation → `team_metrics_daily`.

---

### 🚀 Success Criteria
- ✅ All ingestion completes without error.
- ✅ APIs return live data from both DBs.
- ✅ Conversational Agent can reference team telemetry.
- ✅ ROI dashboard incorporates decision-linked metrics.

**Version:** v0.7.0  |  **Sprint Owner:** Fuxi / Codex  |  **Target Completion:** 2 Weeks After Merge

