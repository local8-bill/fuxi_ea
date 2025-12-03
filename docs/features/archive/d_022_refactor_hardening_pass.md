## Directive D022: Refactor and Hardening Pass (v1)

**Status:** 🚧 In Progress

### Purpose
To stabilize the Fuxi_EA platform through targeted refactors that improve telemetry accuracy, data persistence, backend performance, and UX reliability. This pass consolidates all infrastructure and code hygiene work required to prepare the system for adaptive testing (D019–D021).

---

### Scope of Work

#### 1. Telemetry Hardening
- Add server-side schema validation for telemetry payloads (enforce workspace/event enums, size limits, timestamp format).
- Add API auth/rate limits for `/api/telemetry` POST requests.
- Move telemetry persistence from NDJSON to SQLite (or Postgres in later environments).
- Guard `workspace_view` event to trigger only once per mount.
- Add `/api/telemetry/health` endpoint and unit test.

#### 2. Data Layer Foundation
- Introduce a centralized database layer (SQLite first) with typed accessors and migrations.
- Entities: `intake`, `tech_stack_artifacts`, `normalized_systems`, `graph_nodes`, `edges`, `telemetry_events`, `scoring_data`.
- Remove `localStorage` as source of truth; all data persisted in DB.
- Centralize project context retrieval (avoid scattered state).

#### 3. Graph Backend Services
- Add server-side graph traversal endpoints (`/graph/degrees`, `/graph/paths`, `/graph/impact`).
- Offload traversal logic from client-side ReactFlow to backend.
- Cache Lucid ingestion results and system graph models server-side.

#### 4. Error Handling & UX Feedback
- Add inline fetch failure handling with retry CTAs for:
  - Digital Enterprise → `stats`, `systems` fetch.
  - Tech Stack → ingestion and diff.
- Standardize error banners/spinners across workspaces.

#### 5. Component Reuse & Cleanup
- Consolidate stat pills, headers, and summary cards into shared components.
- Deduplicate summary logic across Intake, Tech Stack, Digital Enterprise, and Portfolio.
- Remove duplicated normalization/formatting helpers.

#### 6. Feature Flags & Secrets
- Enforce strict env variable handling (`OPENAI_API_KEY`, `MESH_AUTH_TOKEN`, `FUXI_AUTH_OPTIONAL`, `NEXT_PUBLIC_FUXI_API_TOKEN`).
- Add local default fallbacks for dev-only.
- Remove secret logs from server console and telemetry output.
- Ensure all write endpoints require authentication.

#### 7. Testing & Validation
- Add smoke tests for `/api/telemetry`, ingestion routes, and workspace flows:
  - Upload → Stats
  - Graph Load → Event Log
- Add CLI utility to validate telemetry summaries.
- Integrate into test runner (`npm test` or `vitest`).

#### 8. Performance Hygiene
- Debounce expensive client fetches (Digital Enterprise graph, telemetry posts).
- Cache or SWR-enable stats endpoints.
- Suppress redundant `workspace_view` events.
- Trim console noise in production build.

---

### Implementation Details
- **Branch:** `refactor/hardening-pass-v1`
- **Docs:** `/docs/refactor_log_2.md` for changes and rationale.
- **Commit Tag:** `refactor_v1_telemetry_hardened`
- **Validation:** Run local build (`npm run dev` + `NEXT_PUBLIC_TELEMETRY_DEBUG=true`) and confirm telemetry summary integrity.

---

### Verification & Validation Table
| Checkpoint | Description | Status | Verified By | Timestamp |
|-------------|-------------|---------|--------------|------------|
| Telemetry Schema Active | Validation + enums enforced | ☐ | Codex | |
| Data Layer Migrated | SQLite storage operational | ☐ | Codex | |
| Graph Backend Online | Traversal endpoints reachable | ☐ | Fuxi | |
| Error UX Unified | Retry banners standardized | ☐ | Mesh | |
| Component Library Updated | Shared UI primitives live | ☐ | Soje | |
| Secrets & Flags Hardened | No plaintext secrets, safe dev defaults | ☐ | Clu | |
| Tests Passing | Core smoke suite green | ☐ | Codex | |
| Performance Benchmarked | Reduced redundant telemetry, stable FPS | ☐ | Mesh | |

---

**Directive Metadata**
- **Project:** Fuxi_EA
- **Directive ID:** D022
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-27
- **Type:** Refactor / Hardening
- **Priority:** Critical
- **Feature Branch:** `refactor/hardening-pass-v1`
- **Next Step:** Codex to execute refactor, log results, and verify telemetry health via `/api/telemetry/health`.  
